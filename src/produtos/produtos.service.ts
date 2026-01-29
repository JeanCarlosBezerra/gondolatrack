// === INÍCIO ARQUIVO NOVO: src/produtos/produtos.service.ts ===
import { Injectable, BadRequestException } from '@nestjs/common';

// ⚠️ Ajuste para o seu serviço real de DB2 (o que você já usa em abastecimento/conferência)
import { Db2Service } from 'src/db2/db2.service';

type SearchParams = {
  idLoja: number;
  q: string;
  page: number;
  limit: number;
};

@Injectable()
export class ProdutosService {
  constructor(private readonly db2: Db2Service) {}

  private normalizePaging(page: number, limit: number) {
    const p = Number.isFinite(page) && page > 0 ? page : 1;
    const l = Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50;
    return { p, l, offset: (p - 1) * l };
  }

  // === ALTERAÇÃO: catálogo geral (paginado) ===
  async search(params: SearchParams) {
    const { idLoja, q } = params;
    if (!idLoja) throw new BadRequestException('idLoja é obrigatório.');

    const { p, l, offset } = this.normalizePaging(params.page, params.limit);

    // ✅ Exemplo: você vai adaptar para suas tabelas reais no DB2
    // A ideia é trazer: idProduto, ean, descricao, ativo, etc.
    const sql = `
    SELECT
      P.IDPRODUTO        AS IDPRODUTO,
      P.IDCODBARPROD     AS EAN,
      P.DESCRRESPRODUTO  AS DESCRICAO
    FROM PRODUTO_GRADE P
    WHERE P.FLAGINATIVO = 'F'
      AND (
        ? = '' OR
        UPPER(P.DESCRRESPRODUTO) LIKE UPPER(?) OR
        VARCHAR(P.IDCODBARPROD) LIKE ? OR
        VARCHAR(P.IDPRODUTO) LIKE ?
      )
    ORDER BY P.DESCRRESPRODUTO
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;

    const binds: any[] = [];
    if (q) {
      binds.push(`%${q}%`, `%${q}%`);
    }
    binds.push(offset, l);

    const rows = await this.db2.query(sql, binds);

    return {
      page: p,
      limit: l,
      items: rows,
      hasNext: rows.length === l,
    };
  }

  // === ALTERAÇÃO: produtos SEM gôndola (paginado) ===
  async semGondola(params: SearchParams) {
    const { idLoja, q } = params;
    if (!idLoja) throw new BadRequestException('idLoja é obrigatório.');

    const { p, l, offset } = this.normalizePaging(params.page, params.limit);

    // Ideia: DB2 produtos LEFT JOIN Postgres gondola_produtos
    // Como DB2 não enxerga Postgres direto:
    // ✅ solução prática agora: buscar do DB2 (paginado) e filtrar via Postgres NÃO escala bem.
    // ✅ solução correta: criar endpoint SQL no seu backend que faça:
    //    - listar do DB2
    //    - e checar vínculo em POSTGRES por idProduto/idLoja (IN) (batelada)
    // Eu deixo aqui a estratégia “batelada”:

    // 1) traz do DB2 uma página de candidatos
    const sqlDb2 = `
      SELECT
        P.IDPRODUTO   AS IDPRODUTO,
        P.EAN        AS EAN,
        P.DESCRICAO  AS DESCRICAO
      FROM DBA.PRODUTOS P
      WHERE 1=1
        ${q ? `AND (UPPER(P.DESCRICAO) LIKE UPPER(?) OR P.EAN LIKE ?)` : ''}
      ORDER BY P.DESCRICAO
      OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;

    const binds: any[] = [];
    if (q) binds.push(`%${q}%`, `%${q}%`);
    binds.push(offset, l);

    const candidatos = await this.db2.query(sqlDb2, binds);

    // 2) checa no Postgres quais já estão em gondola_produtos para esta loja
    // ⚠️ você vai implementar esse método numa repo TypeORM do Postgres:
    //    findIdsProdutosJaNaGondola({ idLoja, idsProdutos })
    // Aqui é só o “contrato”:
    const ids = candidatos.map((x: any) => Number(x.IDPRODUTO)).filter(Boolean);

    const jaNaGondolaSet = new Set<number>(
      await this.findIdsProdutosJaNaGondola(idLoja, ids),
    );

    const semGondola = candidatos.filter((x: any) => !jaNaGondolaSet.has(Number(x.IDPRODUTO)));

    return {
      page: p,
      limit: l,
      items: semGondola,
      hasNext: candidatos.length === l, // aproximado
    };
  }

  // === TODO: implementar com TypeORM no Postgres (gondola_produtos) ===
  private async findIdsProdutosJaNaGondola(idLoja: number, idsProdutos: number[]): Promise<number[]> {
    // retorno vazio por enquanto
    return [];
  }
}
// === FIM ARQUIVO NOVO ===
