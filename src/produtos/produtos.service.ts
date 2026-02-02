import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Db2Service } from 'src/db2/db2.service';
import { GondolaProduto } from 'src/gondolas/gondola-produto.entity';
import { LojaLocalEstoque } from 'src/lojas/loja-local-estoque.entity';
import { Loja } from 'src/lojas/loja.entity';

type SearchParams = {
  idLoja: number;
  q: string;
  page: number;
  limit: number;
};

@Injectable()
export class ProdutosService {
  constructor(
    private readonly db2: Db2Service,

    @InjectRepository(GondolaProduto)
    private readonly gondolaProdutoRepo: Repository<GondolaProduto>,

    @InjectRepository(LojaLocalEstoque)
    private readonly lojaLocalRepo: Repository<LojaLocalEstoque>,

    @InjectRepository(Loja)
    private readonly lojaRepo: Repository<Loja>,
  ) {}

  private normalizePaging(page: number, limit: number) {
    const p = Number.isFinite(page) && page > 0 ? page : 1;
    const l = Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50;
    return { p, l, offset: (p - 1) * l };
  }

  private buildSearchWhere(q: string) {
  const qq = (q ?? '').trim();
  if (!qq) return { where: '1=1', binds: [] as any[] };

  // se for só dígitos, tenta match exato (rápido e indexável)
  const isDigits = /^\d+$/.test(qq);

  if (isDigits) {
    const n = Number(qq);
    if (Number.isFinite(n)) {
      return {
        where: `
          (
            P.IDPRODUTO = ? OR
            P.IDCODBARPROD = ? OR
            UPPER(P.DESCRRESPRODUTO) LIKE UPPER(?)
          )
        `,
        binds: [n, n, `%${qq}%`],
      };
    }
  }

  // texto: mantém LIKE
  return {
    where: `
      (
        UPPER(P.DESCRRESPRODUTO) LIKE UPPER(?) OR
        VARCHAR(P.IDCODBARPROD) LIKE ? OR
        VARCHAR(P.IDPRODUTO) LIKE ?
      )
    `,
    binds: [`%${qq}%`, `%${qq}%`, `%${qq}%`],
  };
}


  // ============================================================
  // 1) CATÁLOGO: lista produtos do DB2 (ativos) paginado
  // ============================================================
  async search(params: SearchParams) {
    const { idLoja, q } = params;
    if (!idLoja) throw new BadRequestException('idLoja é obrigatório.');

    const { p, l, offset } = this.normalizePaging(params.page, params.limit);

    const { where, binds } = this.buildSearchWhere((q ?? '').trim());

    const sql = `
      SELECT
        P.IDPRODUTO        AS IDPRODUTO,
        P.IDCODBARPROD     AS EAN,
        P.DESCRRESPRODUTO  AS DESCRICAO
      FROM PRODUTO_GRADE P
      WHERE P.FLAGINATIVO = 'F'
        AND ${where}
      ORDER BY P.DESCRRESPRODUTO
      OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;

    const rows = await this.db2.query<any>(sql, [...binds, offset, l]);

    return {
      page: p,
      limit: l,
      items: rows,
      hasNext: rows.length === l,
    };
  }

  // ============================================================
  // 2) SEM GÔNDOLA (COM ESTOQUE):
  //    - pega locais da loja (loja_locais_estoque)
  //    - consulta DB2 ESTOQUE_SALDO_ATUAL somando QTD por produto
  //    - filtra somente QTD > 0
  //    - remove os que já estão em gondola_produtos (Postgres)
  // ============================================================
  async semGondola(params: SearchParams) {
    const { idLoja, q } = params;
    if (!idLoja) throw new BadRequestException('idLoja é obrigatório.');

    const { p, l, offset } = this.normalizePaging(params.page, params.limit);

    // 1) pega a loja pra descobrir ID da empresa no DB2 (id_empresa_erp)
    const loja = await this.lojaRepo.findOne({ where: { idLoja } as any });
    if (!loja) throw new BadRequestException('Loja não encontrada.');
    const idEmpresaDb2 = Number((loja as any).idEmpresaErp ?? (loja as any).id_empresa_erp);
    if (!idEmpresaDb2) {
      throw new BadRequestException('Loja sem id_empresa_erp (empresa DB2) configurada.');
    }

    // 2) locais de estoque configurados para a loja (VENDA/DEPOSITO/CD)
    const locais = await this.lojaLocalRepo.find({
      where: { idLoja } as any,
    });

    const idLocais = locais
      .map((x) => Number(x.idLocalEstoque))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (idLocais.length === 0) {
      return { page: p, limit: l, items: [], hasNext: false };
    }

    const { where, binds } = this.buildSearchWhere((q ?? '').trim());
    const placeholders = idLocais.map(() => '?').join(', ');
    const qq = (q ?? '').trim();
    const orderBy = qq ? 'ORDER BY P.DESCRRESPRODUTO' : '';

    // DB2: estoque_saldo_atual tem: IDPRODUTO, IDEMPRESA, IDLOCALESTOQUE, QTDATUALESTOQUE
    // Queremos SOMAR por produto e manter > 0
    const sqlDb2 = `
      SELECT
        P.IDPRODUTO        AS IDPRODUTO,
        P.IDCODBARPROD     AS EAN,
        P.DESCRRESPRODUTO  AS DESCRICAO,
        COALESCE(SUM(ESA.QTDATUALESTOQUE), 0) AS QTD
      FROM PRODUTO_GRADE P
      JOIN ESTOQUE_SALDO_ATUAL ESA
        ON ESA.IDPRODUTO = P.IDPRODUTO
       AND ESA.IDEMPRESA = ?
       AND ESA.IDLOCALESTOQUE IN (${placeholders})
      WHERE P.FLAGINATIVO = 'F'
        AND ${where}
      GROUP BY
        P.IDPRODUTO, P.IDCODBARPROD, P.DESCRRESPRODUTO
      HAVING COALESCE(SUM(ESA.QTDATUALESTOQUE), 0) > 0
      ${orderBy}
      OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;

    const take = Math.min(200, l * 4);

    const candidatos = await this.db2.query<any>(
      sqlDb2,
      [idEmpresaDb2, ...idLocais, ...binds, offset, take],
    );
    
    const ids = candidatos.map((x) => Number(x.IDPRODUTO)).filter(Boolean);
    
    const ja = await this.gondolaProdutoRepo.find({
      select: ['idProduto'] as any,
      where: { idLoja, idProduto: In(ids) } as any,
    });
    
    const jaSet = new Set<number>(ja.map((x) => Number(x.idProduto)));
    
    const sem = candidatos.filter((x) => !jaSet.has(Number(x.IDPRODUTO)));
    
    return {
      page: p,
      limit: l,
      items: sem.slice(0, l),
      hasNext: candidatos.length === take, // aproximado
    };
  }
}
