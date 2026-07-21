// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/gondola-produtos.service.ts ===
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Gondola } from './gondola.entity';
import { GondolaProduto } from './gondola-produto.entity';
import { AddProdutoGondolaDto } from './dto/add-produto-gondola.dto';
import { Loja } from '../lojas/loja.entity';
import { LojaLocalEstoque } from '../lojas/loja-local-estoque.entity';
import { Db2Service } from '../db2/db2.service';

type ReposicaoItem = {
  idGondolaProduto: number;
  ean: string;
  descricao: string;
  estoqueVenda: number;
  minimo: number;
  maximo: number;
  repor: number;
  estoqueDeposito: number;
};

// [ALT] resultado do lookup do produto no DB2 (serve pra EAN e pra código interno)
type ProdutoDb2 = {
  IDPRODUTO: number;
  IDSUBPRODUTO: number;
  IDCODBARPROD: number;
  DESCRCOMPRODUTO: string;
};

@Injectable()
export class GondolaProdutosService {
  constructor(
    @InjectRepository(Gondola) private gondolaRepo: Repository<Gondola>,
    @InjectRepository(GondolaProduto) private gpRepo: Repository<GondolaProduto>,
    @InjectRepository(Loja) private lojaRepo: Repository<Loja>,
    @InjectRepository(LojaLocalEstoque) private lojaLocalRepo: Repository<LojaLocalEstoque>,
    private db2: Db2Service,
  ) {}

  // ============================================================
  // [ALT - CHANGE 3] LISTAGEM COM ESTOQUE AO VIVO + SNAPSHOT
  // Antes: devolvia só o valor persistido (congelado).
  // Agora: recalcula o estoque atual no DB2 (em batch) e devolve
  //        estoqueAtual (AO VIVO) + estoqueSnapshot (FOTO do cadastro).
  // Não salva no banco (leitura pura) — o snapshot fica intacto.
  // ============================================================
  async listByGondola(idGondola: number) {
    const rows = await this.gpRepo.find({
      where: { idGondola },
      order: { atualizadoEm: 'DESC' },
    });
    if (!rows.length) return [];

    const gondola = await this.gondolaRepo.findOne({ where: { idGondola } });
    const loja = gondola
      ? await this.lojaRepo.findOne({ where: { idLoja: gondola.idLoja } })
      : null;

    // Sem empresa ERP não dá pra consultar o DB2 → devolve snapshot como atual (fallback seguro)
    if (!loja?.idEmpresaErp) {
      return rows.map((r) => ({
        ...r,
        estoqueSnapshot: Number(r.estoqueSnapshot ?? 0),
        estoqueAtual: Number(r.estoqueAtual ?? 0),
      }));
    }

    const idEmpresa = Number(loja.idEmpresaErp);

    const locais = await this.lojaLocalRepo.find({
      where: { idLoja: loja.idLoja, idEmpresa: loja.idEmpresaErp },
    });
    const locaisVenda = locais
      .filter((l) => l.papelNaLoja === 'VENDA')
      .map((l) => Number(l.idLocalEstoque));
    const locaisDeposito = locais
      .filter((l) => l.papelNaLoja === 'DEPOSITO')
      .map((l) => Number(l.idLocalEstoque));

    const idProdutos = [...new Set(rows.map((r) => Number(r.idProduto)))];

    // [ALT] 2 consultas em batch (não 2 por produto)
    const vendaMap = locaisVenda.length
      ? await this.getEstoqueBatchPorLocais({ idEmpresa, idProdutos, idLocaisEstoque: locaisVenda })
      : {};
    const depMap = locaisDeposito.length
      ? await this.getEstoqueBatchPorLocais({ idEmpresa, idProdutos, idLocaisEstoque: locaisDeposito })
      : {};

    return rows.map((r) => {
      const v = vendaMap[Number(r.idProduto)] ?? 0;
      const d = depMap[Number(r.idProduto)] ?? 0;
      return {
        ...r,
        estoqueSnapshot: Number(r.estoqueSnapshot ?? 0), // FOTO do cadastro
        estoqueVenda: v,
        estoqueDeposito: d,
        estoqueAtual: v + d, // AO VIVO
      };
    });
  }

  // [ALT - CHANGE 3] estoque em batch: 1 query pra vários produtos de uma vez
  private async getEstoqueBatchPorLocais(params: {
    idEmpresa: number;
    idProdutos: number[];
    idLocaisEstoque: number[];
  }): Promise<Record<number, number>> {
    const { idEmpresa, idProdutos, idLocaisEstoque } = params;
    const out: Record<number, number> = {};
    if (!idProdutos?.length || !idLocaisEstoque?.length) return out;

    const locPh = idLocaisEstoque.map(() => '?').join(', ');
    const prodPh = idProdutos.map(() => '?').join(', ');

    // CAST no SUM pra não estourar (aprendizado do DB2 de vocês)
    const sql = `
      SELECT IDPRODUTO,
             CAST(COALESCE(SUM(QTDATUALESTOQUE), 0) AS DECIMAL(17,3)) AS QTD
      FROM ESTOQUE_SALDO_ATUAL
      WHERE IDEMPRESA = ?
        AND IDLOCALESTOQUE IN (${locPh})
        AND IDPRODUTO IN (${prodPh})
      GROUP BY IDPRODUTO
    `;
    const rows = await this.db2.query<any>(sql, [idEmpresa, ...idLocaisEstoque, ...idProdutos]);
    for (const r of rows ?? []) {
      const id = Number(r.IDPRODUTO ?? r.idproduto);
      const qtd = Number(r.QTD ?? r.qtd ?? 0);
      out[id] = Number.isFinite(qtd) ? qtd : 0;
    }
    return out;
  }

  // helper de estoque por produto único (usado no add/refresh/reposição)
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

  private async getLocalVenda(idLoja: number): Promise<number | null> {
    const row = await this.lojaLocalRepo.findOne({
      where: { idLoja, papelNaLoja: 'VENDA' as any },
    });
    return row?.idLocalEstoque != null ? Number(row.idLocalEstoque) : null;
  }

  private async getLocaisDeposito(idLoja: number, idEmpresa: number): Promise<number[]> {
    const rows = await this.lojaLocalRepo.find({
      where: { idLoja, idEmpresa, papelNaLoja: 'DEPOSITO' },
      order: { idLocalEstoque: 'ASC' },
    });
    return rows.map((r) => Number(r.idLocalEstoque));
  }

  // ============================================================
  // [ALT - CHANGE 2] lookup por EAN — agora traz DESCRCOMPRODUTO (descrição PRINCIPAL da PRODUTO)
  // ============================================================
  private async buscarProdutoDb2PorEan(ean: number): Promise<ProdutoDb2 | null> {
    return this.db2.queryOne<ProdutoDb2>(
      `
      SELECT PG.IDPRODUTO,
             PG.IDSUBPRODUTO,
             PG.IDCODBARPROD,
             P.DESCRCOMPRODUTO
      FROM PRODUTO_GRADE PG
      INNER JOIN PRODUTO P ON P.IDPRODUTO = PG.IDPRODUTO
      WHERE PG.IDCODBARPROD = ?
      FETCH FIRST 1 ROW ONLY
    `,
      [ean],
    );
  }

  // ============================================================
  // [ALT - CHANGE 1] lookup por CÓDIGO INTERNO (IDPRODUTO)
  // Um produto pode ter várias grades → escolhe a "master"
  // (IDSUBPRODUTO = IDPRODUTO), senão uma com código de barras válido.
  // ============================================================
  private async buscarProdutoDb2PorIdProduto(idProduto: number): Promise<ProdutoDb2 | null> {
    return this.db2.queryOne<ProdutoDb2>(
      `
      SELECT P.IDPRODUTO,
             PG.IDSUBPRODUTO,
             PG.IDCODBARPROD,
             P.DESCRCOMPRODUTO
      FROM PRODUTO P
      LEFT JOIN PRODUTO_GRADE PG ON PG.IDPRODUTO = P.IDPRODUTO
      WHERE P.IDPRODUTO = ?
      ORDER BY
        CASE WHEN PG.IDSUBPRODUTO = P.IDPRODUTO THEN 0 ELSE 1 END,
        CASE WHEN COALESCE(PG.IDCODBARPROD, 0) > 0 THEN 0 ELSE 1 END,
        PG.IDSUBPRODUTO
      FETCH FIRST 1 ROW ONLY
    `,
      [idProduto],
    );
  }

  async remove(idGondola: number, idGondolaProduto: number): Promise<void> {
    const item = await this.gpRepo.findOne({ where: { idGondolaProduto, idGondola } });
    if (!item) throw new NotFoundException('Produto não encontrado nesta gôndola.');
    await this.gpRepo.remove(item);
  }

  async refreshEstoqueGondola(idGondola: number) {
    const gondola = await this.gondolaRepo.findOne({ where: { idGondola } });
    if (!gondola) throw new NotFoundException('Gôndola não encontrada');

    const loja = await this.lojaRepo.findOne({ where: { idLoja: gondola.idLoja } });
    if (!loja) throw new NotFoundException('Loja não encontrada');
    if (!loja.idEmpresaErp) {
      throw new BadRequestException('Loja sem idEmpresaErp configurado (necessário para consultar estoque no DB2).');
    }

    const locaisLoja = await this.lojaLocalRepo.find({
      where: { idLoja: loja.idLoja, idEmpresa: loja.idEmpresaErp },
    });

    const locaisVenda = locaisLoja
      .filter((l) => l.papelNaLoja === 'VENDA')
      .map((l) => Number(l.idLocalEstoque));
    if (!locaisVenda.length) {
      throw new BadRequestException('Nenhum local de VENDA configurado para esta loja.');
    }

    const locaisDeposito = locaisLoja
      .filter((l) => l.papelNaLoja === 'DEPOSITO')
      .map((l) => Number(l.idLocalEstoque));

    const produtos = await this.gpRepo.find({ where: { idGondola } });

    for (const gp of produtos) {
      const estoqueVenda = await this.getEstoqueDb2PorLocais({
        idEmpresa: Number(loja.idEmpresaErp),
        idProduto: Number(gp.idProduto),
        idLocaisEstoque: locaisVenda,
      });
      const estoqueDeposito = locaisDeposito.length
        ? await this.getEstoqueDb2PorLocais({
            idEmpresa: Number(loja.idEmpresaErp),
            idProduto: Number(gp.idProduto),
            idLocaisEstoque: locaisDeposito,
          })
        : 0;

      gp.estoqueVenda = estoqueVenda;
      gp.estoqueDeposito = estoqueDeposito;
      gp.estoqueAtual = estoqueVenda + estoqueDeposito;
      gp.atualizadoEm = new Date();
      // OBS: NÃO tocamos em gp.estoqueSnapshot — a foto do cadastro fica intacta.
    }

    await this.gpRepo.save(produtos);
    return produtos;
  }

  async getReposicaoGondola(idGondola: number): Promise<ReposicaoItem[]> {
    const gondola = await this.gondolaRepo.findOne({ where: { idGondola } });
    if (!gondola) throw new NotFoundException('Gôndola não encontrada');

    const loja = await this.lojaRepo.findOne({ where: { idLoja: gondola.idLoja } });
    if (!loja?.idEmpresaErp) throw new NotFoundException('Loja sem idEmpresaErp configurado');

    const idLocalVenda = await this.getLocalVenda(loja.idLoja);
    if (!idLocalVenda) throw new NotFoundException('Local VENDA não configurado');

    const locaisDeposito = await this.getLocaisDeposito(loja.idLoja, Number(loja.idEmpresaErp));
    const produtos = await this.gpRepo.find({ where: { idGondola } });

    const idEmpresaErp = Number(loja.idEmpresaErp);
    if (!Number.isFinite(idEmpresaErp)) throw new NotFoundException('Loja sem idEmpresaErp configurado');

    const out: ReposicaoItem[] = [];

    for (const gp of produtos) {
      const estoqueVenda = await this.getEstoqueDb2PorLocais({
        idEmpresa: idEmpresaErp,
        idProduto: gp.idProduto,
        idLocaisEstoque: [Number(idLocalVenda)],
      });
      const estoqueDeposito = await this.getEstoqueDb2PorLocais({
        idEmpresa: idEmpresaErp,
        idProduto: gp.idProduto,
        idLocaisEstoque: (locaisDeposito ?? []).map(Number),
      });

      const repor = Math.max((gp.maximo ?? 0) - estoqueVenda, 0);

      out.push({
        idGondolaProduto: gp.idGondolaProduto,
        ean: gp.ean,
        descricao: gp.descricao,
        estoqueVenda,
        minimo: gp.minimo,
        maximo: gp.maximo,
        repor,
        estoqueDeposito,
      });

      gp.estoqueAtual = estoqueVenda;
      gp.atualizadoEm = new Date();
      // OBS: snapshot intacto aqui também.
      await this.gpRepo.save(gp);
    }

    return out;
  }

  // ============================================================
  // [ALT - CHANGES 1, 2 e 3] adicionar produto
  // - 1: aceita EAN OU código interno no mesmo campo
  // - 2: grava a descrição PRINCIPAL (DESCRCOMPRODUTO)
  // - 3: grava o estoqueSnapshot (foto única do cadastro)
  // ============================================================
  async addByBip(idGondola: number, dto: AddProdutoGondolaDto) {
    const gondola = await this.gondolaRepo.findOne({ where: { idGondola } });
    if (!gondola) throw new NotFoundException('Gôndola não encontrada');

    if (dto.minimo === undefined || dto.maximo === undefined) {
      throw new BadRequestException('Informe mínimo e máximo.');
    }
    if (dto.minimo < 0 || dto.maximo < 0) {
      throw new BadRequestException('Mínimo e máximo não podem ser negativos.');
    }
    if (dto.maximo < dto.minimo) {
      throw new BadRequestException('Máximo não pode ser menor que mínimo.');
    }

    const loja = await this.lojaRepo.findOne({ where: { idLoja: gondola.idLoja } });
    if (!loja) throw new NotFoundException('Loja não encontrada');
    if (!loja?.idEmpresaErp) {
      throw new BadRequestException('Loja sem idEmpresa configurado (necessário para consultar estoque no DB2).');
    }

    const locais = await this.lojaLocalRepo.find({
      where: { idLoja: loja.idLoja, idEmpresa: loja.idEmpresaErp },
    });

    // [ALT - CHANGE 1] o campo "ean" agora aceita EAN OU código interno
    const termo = String(dto.ean ?? '').replace(/\D/g, '');
    if (!termo) throw new BadRequestException('Informe o EAN ou o código interno.');
    const num = Number(termo);

    // Tenta EAN primeiro (bipagem); se não achar, tenta como IDPRODUTO
    let produtoDb2 = await this.buscarProdutoDb2PorEan(num);
    if (!produtoDb2) {
      produtoDb2 = await this.buscarProdutoDb2PorIdProduto(num);
    }
    if (!produtoDb2) {
      throw new NotFoundException('Produto não encontrado no ERP (EAN ou código interno).');
    }

    const idProdutoDb2 = Number(produtoDb2.IDPRODUTO);
    const eanDb2 =
      produtoDb2.IDCODBARPROD && Number(produtoDb2.IDCODBARPROD) > 0
        ? String(produtoDb2.IDCODBARPROD)
        : ''; // produto sem código de barras (adicionado por código interno)
    // [ALT - CHANGE 2] descrição principal
    const descrDb2 = String(produtoDb2.DESCRCOMPRODUTO ?? '').trim().slice(0, 200);

    const locaisVenda = locais
      .filter((l) => l.papelNaLoja === 'VENDA')
      .map((l) => Number(l.idLocalEstoque));
    if (!locaisVenda.length) {
      throw new BadRequestException('Nenhum local de VENDA configurado para esta loja.');
    }

    const locaisDeposito = locais
      .filter((l) => l.papelNaLoja === 'DEPOSITO')
      .map((l) => Number(l.idLocalEstoque));

    const estoqueVenda = await this.getEstoqueDb2PorLocais({
      idEmpresa: Number(loja.idEmpresaErp),
      idProduto: idProdutoDb2,
      idLocaisEstoque: locaisVenda,
    });
    const estoqueDeposito = locaisDeposito.length
      ? await this.getEstoqueDb2PorLocais({
          idEmpresa: Number(loja.idEmpresaErp),
          idProduto: idProdutoDb2,
          idLocaisEstoque: locaisDeposito,
        })
      : 0;

    const estoqueAtual = estoqueVenda + estoqueDeposito; // TOTAL LOJA

    // [ALT] dedupe por IDPRODUTO (bate com os UNIQUE da entity; ean pode vir vazio)
    const jaExiste = await this.gpRepo.findOne({
      where: { idGondola: gondola.idGondola, idProduto: idProdutoDb2 },
    });
    if (jaExiste) {
      throw new BadRequestException('Este produto já está vinculado a esta gôndola.');
    }

    const entity = this.gpRepo.create({
      idGondola: gondola.idGondola,
      idLoja: gondola.idLoja,
      idProduto: idProdutoDb2,
      ean: eanDb2,
      descricao: descrDb2,
      minimo: dto.minimo,
      maximo: dto.maximo,
      estoqueAtual,
      estoqueVenda,
      estoqueDeposito,
      estoqueSnapshot: estoqueAtual, // [ALT - CHANGE 3] foto única do cadastro
    });

    try {
      return await this.gpRepo.save(entity);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const code = (e as any)?.driverError?.code;
        if (code === '23505') {
          throw new BadRequestException('Este produto já está vinculado a esta gôndola.');
        }
      }
      throw e;
    }
  }
}
// === FIM ARQUIVO AJUSTADO ===