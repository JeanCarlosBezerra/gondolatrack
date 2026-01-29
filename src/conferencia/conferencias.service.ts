import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from "typeorm";
import { CreateConferenciaDto } from './dto/create-conferencia.dto';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';
import { ListarConferenciasDto } from './dto/listar-conferencias.dto'; // [NOVO]

import { Db2Service } from '../db2/db2.service';
import { DivergenciasResponseDto, DivergenciaItemDto } from './dto/divergencia.dto';


function toNum(v: any): number {
  const n = Number(String(v ?? 0).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

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

async getDivergencias(
  idGondola: number,
  idConferencia: number,
  opts?: { realtime?: boolean },
) {
  const realtime = !!opts?.realtime;

  // 1) Busca conferência + itens (do Postgres)
  const conf = await this.confRepo.findOne({
    where: { idConferencia, idGondola },
    relations: { itens: true },
  });

  if (!conf) {
    throw new NotFoundException('Conferência não encontrada.');
  }

  // Se NÃO for realtime => devolve snapshot (sem DB2)
  // (mantém compatibilidade: se algum campo estiver null, cai no estoque_loja_snapshot)
  if (!realtime) {
    const itensSnapshot = (conf.itens ?? []).map((it: any) => {
      const venda = it.estoqueVenda ?? null;
      const deposito = it.estoqueDeposito ?? null;

      const lojaTotal =
        it.estoqueLojaTotal ??
        // fallback: usa legado (estoque_loja_snapshot era o total da loja)
        it.estoqueLojaSnapshot ??
        null;

      return {
        ...it,
        estoqueVenda: venda,
        estoqueDeposito: deposito,
        estoqueLojaTotal: lojaTotal,
        // não manda “estoqueCd/estoqueTotal” se você não estiver usando
      };
    });

    return {
      ...conf,
      itens: itensSnapshot,
      mode: 'SNAPSHOT',
    };
  }

  // === A partir daqui: REALTIME (consulta DB2) ===

  // 2) Descobre a loja da gôndola
  const gondolaRow = await this.confRepo.query(
    `SELECT id_loja FROM gondolatrack.gondolas WHERE id_gondola = $1`,
    [idGondola],
  );

  const idLoja = Number(gondolaRow?.[0]?.id_loja);
  if (!Number.isFinite(idLoja)) {
    throw new NotFoundException('Não foi possível identificar a loja da gôndola.');
  }

  // 3) Locais da LOJA (VENDA/DEPOSITO)
  const locaisLojaRows = await this.confRepo.query(
    `
      SELECT id_empresa, id_local_estoque, papel_na_loja
      FROM gondolatrack.loja_locais_estoque
      WHERE id_loja = $1
        AND papel_na_loja IN ('VENDA', 'DEPOSITO')
    `,
    [idLoja],
  );

  const idEmpresaLoja = Number(locaisLojaRows?.[0]?.id_empresa);

  const idsLocaisVenda = (locaisLojaRows ?? [])
    .filter((r: any) => String(r.papel_na_loja).toUpperCase() === 'VENDA')
    .map((r: any) => Number(r.id_local_estoque))
    .filter((n: any) => Number.isFinite(n));

  const idsLocaisDeposito = (locaisLojaRows ?? [])
    .filter((r: any) => String(r.papel_na_loja).toUpperCase() === 'DEPOSITO')
    .map((r: any) => Number(r.id_local_estoque))
    .filter((n: any) => Number.isFinite(n));

  // 4) Enriquecer cada item com estoque em tempo real do DB2
  const itensRealtime = await Promise.all(
    (conf.itens ?? []).map(async (it: any) => {
      const idProdutoNum = Number(it.idProduto);

      if (!Number.isFinite(idProdutoNum)) {
        return {
          ...it,
          estoqueVenda: null,
          estoqueDeposito: null,
          estoqueLojaTotal: null,
        };
      }

      const estoqueVenda =
        Number.isFinite(idEmpresaLoja) && idsLocaisVenda.length
          ? await this.getEstoqueDb2PorLocais({
              idEmpresa: idEmpresaLoja,
              idProduto: idProdutoNum,
              idLocaisEstoque: idsLocaisVenda,
            })
          : 0;

      const estoqueDeposito =
        Number.isFinite(idEmpresaLoja) && idsLocaisDeposito.length
          ? await this.getEstoqueDb2PorLocais({
              idEmpresa: idEmpresaLoja,
              idProduto: idProdutoNum,
              idLocaisEstoque: idsLocaisDeposito,
            })
          : 0;

      const estoqueLojaTotal = (estoqueVenda ?? 0) + (estoqueDeposito ?? 0);

      return {
        ...it,
        estoqueVenda,
        estoqueDeposito,
        estoqueLojaTotal,
      };
    }),
  );

  return {
    ...conf,
    itens: itensRealtime,
    mode: 'REALTIME',
  };
}

  // [NOVO] Calcula resumo da conferência baseado no estoque da LOJA
private calcularResumoLojaSnapshot(conf: GondolaConferencia) {
  const itens = conf.itens ?? [];

  let qtdItens = itens.length;
  let totalConferido = 0;
  let qtdDivergentesLoja = 0;
  let somaDivergLoja = 0;

  const EPS = 0.0005;

  for (const it of itens) {
    const qtd = toNum(it.qtdConferida);
    const estoqueLoja = toNum(it.estoqueLojaTotal); // 👈 snapshot

    totalConferido += qtd;

    const diff = round3(qtd - estoqueLoja);
    if (Math.abs(diff) > EPS) {
      qtdDivergentesLoja += 1;
      somaDivergLoja += diff;
    }
  }

  return {
    qtdItens,
    totalConferido: round3(totalConferido),
    qtdDivergentesLoja,
    somaDivergLoja: round3(somaDivergLoja),
  };
}


// === INÍCIO ALTERAÇÃO: src/conferencia/conferencias.service.ts (criar) ===
async criar(idGondola: number, dto: CreateConferenciaDto, user: any) {
  if (!user?.username) throw new NotFoundException('Usuário não identificado no token.');

  // 1) Descobre loja
  const gondolaRow = await this.confRepo.query(
    `SELECT id_loja FROM gondolatrack.gondolas WHERE id_gondola = $1`,
    [idGondola],
  );

  const idLoja = Number(gondolaRow?.[0]?.id_loja);
  if (!Number.isFinite(idLoja)) {
    throw new NotFoundException('Não foi possível identificar a loja da gôndola.');
  }

  // 2) Locais da LOJA (VENDA/DEPOSITO)  ✅ PRECISA trazer papel_na_loja
  const locaisLojaRows = await this.confRepo.query(
    `
      SELECT id_empresa, id_local_estoque, papel_na_loja
      FROM gondolatrack.loja_locais_estoque
      WHERE id_loja = $1
        AND papel_na_loja IN ('VENDA', 'DEPOSITO')
    `,
    [idLoja],
  );

  const idEmpresaLoja = Number(locaisLojaRows?.[0]?.id_empresa);

  const idsVenda = (locaisLojaRows ?? [])
    .filter((r: any) => String(r.papel_na_loja).toUpperCase() === 'VENDA')
    .map((r: any) => Number(r.id_local_estoque))
    .filter((n: any) => Number.isFinite(n));

  const idsDeposito = (locaisLojaRows ?? [])
    .filter((r: any) => String(r.papel_na_loja).toUpperCase() === 'DEPOSITO')
    .map((r: any) => Number(r.id_local_estoque))
    .filter((n: any) => Number.isFinite(n));

  // 3) Cria conferência
  const conf = this.confRepo.create({
    idGondola,
    usuario: user.username,
    nome: user.nome ?? null,
    itens: [],
    qtdItens: 0,
    totalConferido: '0',
    qtdDivergentesLoja: 0,
    somaDivergLoja: '0',
  });

  // 4) Itens + snapshots
  conf.itens = await Promise.all((dto.itens ?? []).map(async (i) => {
    const idProdutoNum = i.idProduto != null ? Number(i.idProduto) : null;

    let estoqueVendaSnapshot = 0;
    let estoqueDepositoSnapshot = 0;

    if (Number.isFinite(idProdutoNum) && Number.isFinite(idEmpresaLoja)) {
      if (idsVenda.length > 0) {
        estoqueVendaSnapshot = await this.getEstoqueDb2PorLocais({
          idEmpresa: idEmpresaLoja,
          idProduto: idProdutoNum!,
          idLocaisEstoque: idsVenda,
        });
      }

      if (idsDeposito.length > 0) {
        estoqueDepositoSnapshot = await this.getEstoqueDb2PorLocais({
          idEmpresa: idEmpresaLoja,
          idProduto: idProdutoNum!,
          idLocaisEstoque: idsDeposito,
        });
      }
    }

    const estoqueLojaTotalSnapshot = (estoqueVendaSnapshot ?? 0) + (estoqueDepositoSnapshot ?? 0);

    const item = this.itemRepo.create({
      idProduto: i.idProduto != null ? String(i.idProduto) : null,
      ean: i.ean ?? null,
      descricao: i.descricao ?? null,
      qtdConferida: String(i.qtdConferida ?? 0),

      // legado (snapshot total da loja)
      estoqueLojaSnapshot: String(estoqueLojaTotalSnapshot ?? 0),

      // novos snapshots
      estoqueVenda: String(estoqueVendaSnapshot ?? 0),
      estoqueDeposito: String(estoqueDepositoSnapshot ?? 0),
      estoqueLojaTotal: String(estoqueLojaTotalSnapshot ?? 0),
    });

    item.conferencia = conf;
    return item;
  }));

  // 5) salva conf + itens
  await this.confRepo.save(conf);

  // 6) recarrega com itens
  const confSalva = await this.confRepo.findOne({
    where: { idConferencia: conf.idConferencia, idGondola },
    relations: { itens: true },
  });
  if (!confSalva) throw new NotFoundException('Falha ao salvar conferência.');

  // 7) resumo (mantém como está)
  const resumo = this.calcularResumoLojaSnapshot(confSalva);

  await this.confRepo.update(
    { idConferencia: confSalva.idConferencia },
    {
      qtdItens: resumo.qtdItens,
      totalConferido: String(resumo.totalConferido),
      qtdDivergentesLoja: resumo.qtdDivergentesLoja,
      somaDivergLoja: String(resumo.somaDivergLoja),
    },
  );

  // 8) atualiza gôndola
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
    [confSalva.idConferencia, confSalva.criadoEm, confSalva.usuario, idGondola],
  );

  return this.getUltima(idGondola);
}
// === FIM ALTERAÇÃO ===



async getUltima(idGondola: number) {
  const ultima = await this.confRepo.findOne({
    where: { idGondola },
    order: { criadoEm: 'DESC' },
    relations: { itens: true },
  });

  if (!ultima) return null;

  const EPS = 0.0005;

  const hasDiv = (ultima.itens ?? []).some((it: any) => {
    const qtd = Number(it.qtdConferida ?? 0);
    const est = Number(it.estoqueLojaSnapshot ?? 0);
    return Number.isFinite(qtd) && Number.isFinite(est) && Math.abs(qtd - est) > EPS;
  });

  return { ...ultima, status: hasDiv ? 'DIVERGENTE' : 'CONFERIDA' };
}

  // === FIM ALTERAÇÃO ===

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

