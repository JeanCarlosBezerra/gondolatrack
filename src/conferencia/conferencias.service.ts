import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConferenciaDto } from './dto/create-conferencia.dto';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';
import { ListarConferenciasDto } from './dto/listar-conferencias.dto'; // [NOVO]

@Injectable()
export class ConferenciasService {
  constructor(
    @InjectRepository(GondolaConferencia) private confRepo: Repository<GondolaConferencia>,
    @InjectRepository(GondolaConferenciaItem) private itemRepo: Repository<GondolaConferenciaItem>,
  ) {}

  async getPorId(idGondola: number, idConferencia: number) {
  const conf = await this.confRepo.findOne({
    where: {
      idConferencia,
      idGondola,
    },
    relations: { itens: true },
  });

  if (!conf) {
    throw new NotFoundException('Conferência não encontrada.');
  }

  return conf;
}

  async getUltima(idGondola: number) {
    const ultima = await this.confRepo.findOne({
      where: { idGondola },
      order: { criadoEm: 'DESC' },
      relations: { itens: true },
    });
    
    return ultima ?? null;
  }


async criar(idGondola: number, dto: CreateConferenciaDto, user: any) {
  if (!user?.username) throw new NotFoundException('Usuário não identificado no token.');

  const conf = this.confRepo.create({
    idGondola,
    usuario: user.username,
    nome: user.nome ?? null,
    itens: [],
  });

  conf.itens = (dto.itens ?? []).map((i) => {
    const item = this.itemRepo.create({
      idProduto: i.idProduto != null ? String(i.idProduto) : null,
      ean: i.ean ?? null,
      descricao: i.descricao ?? null,
      qtdConferida: String(i.qtdConferida ?? 0),
    });

    // garante o vínculo (FK)
    item.conferencia = conf;
    return item;
  });

  await this.confRepo.save(conf);
  return this.getUltima(idGondola);
}

 async listar(q: ListarConferenciasDto) {
    // filtros (todos opcionais)
    const idLoja = q.idLoja ? Number(q.idLoja) : null;
    const idGondola = q.idGondola ? Number(q.idGondola) : null;
    const usuario = q.usuario ? String(q.usuario).trim() : null;
    const dtIni = q.dtIni ? String(q.dtIni).trim() : null;
    const dtFim = q.dtFim ? String(q.dtFim).trim() : null;

    const where: string[] = ['1=1'];
    const params: any[] = [];

    // helper para parametros posicionais $1, $2...
    const addParam = (val: any) => {
      params.push(val);
      return `$${params.length}`;
    };

    if (idLoja !== null && Number.isFinite(idLoja)) {
      where.push(`g.id_loja = ${addParam(idLoja)}`);
    }

    if (idGondola !== null && Number.isFinite(idGondola)) {
      where.push(`c.id_gondola = ${addParam(idGondola)}`);
    }

    if (usuario) {
      // pesquisa por "JEAN", "JEAN.BEZERRA", etc.
      where.push(`c.usuario ILIKE ${addParam(`%${usuario}%`)}`);
    }

    // dtIni/dtFim: considere que no front você manda "YYYY-MM-DD"
    // dtIni => >= 00:00:00, dtFim => < (dtFim + 1 dia)
    if (dtIni) {
      where.push(`c.criado_em >= ${addParam(dtIni)}::date`);
    }
    if (dtFim) {
      where.push(`c.criado_em < (${addParam(dtFim)}::date + interval '1 day')`);
    }

    const sql = `
      SELECT
        c.id_conferencia,
        c.id_gondola,
        g.nome        AS "nomeGondola",
        g.id_loja     AS "idLoja",
        c.usuario     AS "usuario",
        c.nome        AS "nomeUsuario",
        c.criado_em   AS "criadoEm",
        COUNT(i.id_item)                      AS "qtdItens",
        COALESCE(SUM(i.qtd_conferida), 0)     AS "totalConferido"
      FROM gondolatrack.gondola_conferencia c
      JOIN gondolatrack.gondolas g
        ON g.id_gondola = c.id_gondola
      LEFT JOIN gondolatrack.gondola_conferencia_item i
        ON i.id_conferencia = c.id_conferencia
      WHERE ${where.join(' AND ')}
      GROUP BY
        c.id_conferencia,
        c.id_gondola,
        g.nome,
        g.id_loja,
        c.usuario,
        c.nome,
        c.criado_em
      ORDER BY c.criado_em DESC
      LIMIT 200
    `;

    const rows = await this.confRepo.query(sql, params);
    return rows;
  }

// === FIM TRECHO AJUSTADO ===
}

