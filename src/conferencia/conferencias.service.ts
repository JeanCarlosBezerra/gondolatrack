import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from "typeorm";
import { CreateConferenciaDto } from './dto/create-conferencia.dto';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';
import { ListarConferenciasDto } from './dto/listar-conferencias.dto'; // [NOVO]

import { Db2Service } from '../db2/db2.service';
import { DivergenciasResponseDto, DivergenciaItemDto } from './dto/divergencia.dto';

@Injectable()
export class ConferenciasService {
  constructor(
    @InjectRepository(GondolaConferencia) private confRepo: Repository<GondolaConferencia>,
    @InjectRepository(GondolaConferenciaItem) private itemRepo: Repository<GondolaConferenciaItem>,
    private dataSource: DataSource,
    private db2: Db2Service,
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

 private async getEstoqueDb2PorLocais(params: {
    idEmpresa: number;
    idProduto: number;
    idLocaisEstoque: number[];
  }): Promise<number> {
    const { idEmpresa, idProduto, idLocaisEstoque } = params;
    if (!idLocaisEstoque || idLocaisEstoque.length === 0) return 0;

    const placeholders = idLocaisEstoque.map(() => '?').join(', ');

    const sql = `
      SELECT COALESCE(SUM(QTDATUALESTOQUE), 0) AS QTD
      FROM ESTOQUE_SALDO_ATUAL
      WHERE IDPRODUTO = ?
        AND IDEMPRESA = ?
        AND IDLOCALESTOQUE IN (${placeholders})
    `;

    const rows = await this.db2.query<any>(sql, [idProduto, idEmpresa, ...idLocaisEstoque]);
    const qtdRaw = rows?.[0]?.QTD ?? rows?.[0]?.qtd ?? 0;
    const qtd = Number(qtdRaw);
    return Number.isFinite(qtd) ? qtd : 0;
  }

  async getDivergencias(idGondola: number, idConferencia: number) {
  // 1) Busca conferência + itens
  const conf = await this.confRepo.findOne({
    where: { idConferencia, idGondola },
    relations: { itens: true },
  });

  if (!conf) {
    throw new NotFoundException('Conferência não encontrada.');
  }

  // 2) Descobre a loja da gôndola
  const gondolaRow = await this.confRepo.query(
    `SELECT id_loja FROM gondolatrack.gondolas WHERE id_gondola = $1`,
    [idGondola],
  );

  const idLoja = Number(gondolaRow?.[0]?.id_loja);
  if (!Number.isFinite(idLoja)) {
    throw new NotFoundException('Não foi possível identificar a loja da gôndola.');
  }

  // 3) Locais da LOJA (papéis VENDA/DEPOSITO) -> estoque "loja"
  const locaisLojaRows = await this.confRepo.query(
    `
      SELECT id_empresa, id_local_estoque
      FROM gondolatrack.loja_locais_estoque
      WHERE id_loja = $1
        AND papel_na_loja IN ('VENDA', 'DEPOSITO')
    `,
    [idLoja],
  );

  const idEmpresaLoja = Number(locaisLojaRows?.[0]?.id_empresa);
  const idsLocaisLoja = (locaisLojaRows ?? [])
    .map((r: any) => Number(r.id_local_estoque))
    .filter((n: any) => Number.isFinite(n));

  // 4) Locais do CD (regra que você já usa: IDEMPRESA_CD = 9 e papel 'CD')
  const IDEMPRESA_CD = 9;

  const locaisCdRows = await this.confRepo.query(
    `
      SELECT id_local_estoque
      FROM gondolatrack.loja_locais_estoque
      WHERE papel_na_loja = 'CD'
        AND id_empresa = $1
    `,
    [IDEMPRESA_CD],
  );

  const idsLocaisCd = (locaisCdRows ?? [])
    .map((r: any) => Number(r.id_local_estoque))
    .filter((n: any) => Number.isFinite(n));

  // 5) Enriquecer cada item com estoque do sistema
  const itensEnriquecidos = await Promise.all(
    (conf.itens ?? []).map(async (it) => {
      const idProdutoNum = Number(it.idProduto);

      // Se não tiver idProduto válido, não dá para consultar DB2
      if (!Number.isFinite(idProdutoNum)) {
        return {
          ...it,
          estoqueLoja: null,
          estoqueCd: null,
          estoqueTotal: null,
        };
      }

      // estoque loja = soma locais VENDA/DEPOSITO
      const estoqueLoja =
        Number.isFinite(idEmpresaLoja) && idsLocaisLoja.length
          ? await this.getEstoqueDb2PorLocais({
              idEmpresa: idEmpresaLoja,
              idProduto: idProdutoNum,
              idLocaisEstoque: idsLocaisLoja,
            })
          : 0;

      // estoque CD = soma locais do CD (empresa 9)
      const estoqueCd =
        idsLocaisCd.length
          ? await this.getEstoqueDb2PorLocais({
              idEmpresa: IDEMPRESA_CD,
              idProduto: idProdutoNum,
              idLocaisEstoque: idsLocaisCd,
            })
          : 0;

      const estoqueTotal = (estoqueLoja ?? 0) + (estoqueCd ?? 0);

      return {
        ...it,
        estoqueLoja,
        estoqueCd,
        estoqueTotal,
      };
    }),
  );

  // 6) Retorna o mesmo "shape" que o front já entende
  return {
    ...conf,
    itens: itensEnriquecidos,
  };
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

  await this.dataSource.query(
    `
    UPDATE gondolatrack.gondolas
       SET flag_conferida = true,
           ultima_conferencia_id = $1,
           ultima_conferencia_em = $2,
           ultima_conferencia_usuario = $3,
           atualizado_em = now()
     WHERE id_gondola = $4
    `,
    [conf.idConferencia, conf.criadoEm, conf.usuario, idGondola],
  );

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

