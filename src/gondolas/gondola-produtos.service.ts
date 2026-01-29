// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/gondola-produtos.service.ts ===
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Gondola } from './gondola.entity';
import { GondolaProduto } from './gondola-produto.entity';
import { AddProdutoGondolaDto } from './dto/add-produto-gondola.dto';
import { Loja } from '../lojas/loja.entity';
import { LojaLocalEstoque } from '../lojas/loja-local-estoque.entity';
import { Db2Service } from '../db2/db2.service';
import { QueryFailedError } from 'typeorm';

type ReposicaoItem = {
  idGondolaProduto: number;
  ean: string;
  descricao: string;
  estoqueVenda: number;
  minimo: number;
  maximo: number;
  repor: number; // 👈 o front está usando "repor"
  estoqueDeposito: number;
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


  async listByGondola(idGondola: number) {
    return this.gpRepo.find({
      where: { idGondola },
      order: { atualizadoEm: 'DESC' },
    });
  }


// ✅ AJUSTE: helper recebe ARRAY (idLocaisEstoque)
private async getEstoqueDb2PorLocais(params: {
  idEmpresa: number;
  idProduto: number;
  idLocaisEstoque: number[];
}): Promise<number> {
  const { idEmpresa, idProduto, idLocaisEstoque } = params;

  if (!idLocaisEstoque || idLocaisEstoque.length === 0) return 0;

  const placeholders = idLocaisEstoque.map(() => "?").join(", ");

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
// === FIM TRECHO AJUSTADO ===
    // === FIM TRECHO AJUSTADO ===   

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

    async remove(idGondola: number, idGondolaProduto: number): Promise<void> {
      // garante que o registro pertence à gôndola informada (evita apagar coisa errada)
      const item = await this.gpRepo.findOne({
        where: { idGondolaProduto, idGondola },
      });

      if (!item) {
        throw new NotFoundException('Produto não encontrado nesta gôndola.');
      }

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

  const produtos = await this.gpRepo.find({ where: { idGondola } });

  const locaisDeposito = locaisLoja
  .filter((l) => l.papelNaLoja === 'DEPOSITO')
  .map((l) => Number(l.idLocalEstoque));

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
          
      const locaisDeposito = await this.getLocaisDeposito(
        loja.idLoja,
        Number(loja.idEmpresaErp),
      );
        
      const produtos = await this.gpRepo.find({ where: { idGondola } });

      console.log('[REPOSICAO] loja:', {
        idLoja: loja.idLoja,
        idEmpresaErp: loja.idEmpresaErp,
      });

      const idEmpresaErp = Number(loja.idEmpresaErp);
      if (!Number.isFinite(idEmpresaErp)) throw new NotFoundException('Loja sem idEmpresaErp configurado');

      console.log('[REPOSICAO] idLocalVenda:', idLocalVenda);
      console.log('[REPOSICAO] locaisDeposito:', locaisDeposito);
      console.log('[REPOSICAO] qtdProdutos:', produtos.length);

        
      // ✅ TIPADO (resolve o erro do out.push)
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

            // [ALTERADO] regra solicitada: repor = maximo - estoqueVenda (se <0 => 0)
      const repor = Math.max((gp.maximo ?? 0) - estoqueVenda, 0);

      // [OPCIONAL] se você quiser manter a visão "o que dá para repor com o depósito"
      const reporDisponivel = Math.min(repor, estoqueDeposito);
    
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
      await this.gpRepo.save(gp);
    }

          return out;
    }
    

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

    const locaisIds = locais.map((l) => Number(l.idLocalEstoque));

    const eanDigits = String(dto.ean ?? '').replace(/\D/g, '');
    if (!eanDigits) throw new BadRequestException('Informe o EAN.');
    const eanNum = Number(eanDigits);

    const produtoDb2 = await this.db2.queryOne<{
      IDPRODUTO: number;
      IDCODBARPROD: number;
      DESCRRESPRODUTO?: string;  // pode variar no seu DB2
    }>(`
      SELECT
        IDPRODUTO,
        IDCODBARPROD,
        DESCRRESPRODUTO
      FROM PRODUTO_GRADE PG
      WHERE IDCODBARPROD = ?
      FETCH FIRST 1 ROW ONLY
    `, [eanNum]);
    
    if (!produtoDb2) {
      throw new NotFoundException('Produto não encontrado no ERP');
    }

    
    const idProdutoDb2 = Number(produtoDb2.IDPRODUTO);
    const eanDb2 = String(produtoDb2.IDCODBARPROD);
    const descrDb2 = String(produtoDb2.DESCRRESPRODUTO);
    
    const idLocalVenda = await this.getLocalVenda(loja.idLoja);
    if (!idLocalVenda) {
      throw new BadRequestException('Local VENDA não configurado para esta loja (loja_locais_estoque).');
    }
    
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
    
    const jaExiste = await this.gpRepo.findOne({
      where: { idGondola: gondola.idGondola, ean: eanDb2 },
    });

    if (jaExiste) {
      throw new BadRequestException('Este produto já está vinculado a esta gôndola.');
    }

    const entity = this.gpRepo.create({
      idGondola: gondola.idGondola,
      idLoja: gondola.idLoja,
      idProduto: Number(produtoDb2.IDPRODUTO),
      ean: eanDb2,
      descricao: descrDb2,
      minimo: dto.minimo,
      maximo: dto.maximo,
    
      // [ALTERAÇÃO] grava 3 estoques
      estoqueAtual,       // TOTAL LOJA
      estoqueVenda,       // NOVO
      estoqueDeposito,    // NOVO
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
