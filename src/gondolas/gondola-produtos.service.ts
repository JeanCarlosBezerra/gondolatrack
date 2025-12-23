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

  // === INÍCIO TRECHO AJUSTADO: getEstoqueAtualDb2 ===
private async getEstoqueAtualDb2(params: {
  idEmpresa: number;
  idLocalEstoque: number;
  idProduto: number;
}): Promise<number> {
  const { idEmpresa, idProduto, idLocalEstoque } = params;

  const sql = `
    SELECT COALESCE(SUM(QTDATUALESTOQUE), 0) AS QTD
    FROM ESTOQUE_SALDO_ATUAL
    WHERE IDPRODUTO = ?
      AND IDEMPRESA = ?
      AND IDLOCALESTOQUE = ?
  `;
  const rows = await this.db2.query<any>(sql, [idProduto, idEmpresa, idLocalEstoque]);

  const qtdRaw = rows?.[0]?.QTD ?? rows?.[0]?.qtd ?? 0;

  // trata "2,340" / "2.340" / "2.340,50" (driver/locale variando)
  const s = String(qtdRaw).trim();

  // se vier "2,340" como decimal -> vira 2.340
  // se vier "2.340,50" -> vira 2340.50
  let normalized = s;

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(",", ".");
  }

  const qtd = Number(normalized);
  if (!Number.isFinite(qtd)) return 0;
  return Math.max(0, qtd); // sem floor
}
// === FIM TRECHO AJUSTADO ===
    // === FIM TRECHO AJUSTADO ===   

    private async getLocalVenda(idLoja: number) {
      const row = await this.lojaLocalRepo.findOne({
        where: { idLoja, papelNaLoja: 'VENDA' as any },
      });
      return row?.idLocalEstoque ?? null;
    }

    private async getLocaisDeposito(idLoja: number) {
      const rows = await this.lojaLocalRepo.find({
        where: { idLoja, papelNaLoja: 'DEPOSITO' as any },
      });
      return rows.map(r => r.idLocalEstoque);
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
      if (!loja?.idEmpresa) throw new NotFoundException('Loja sem idEmpresa configurado');

      const idLocalVenda = await this.getLocalVenda(loja.idLoja);
      if (!idLocalVenda) {
        throw new NotFoundException('Local VENDA não configurado para esta loja');
      }
    
      const produtos = await this.gpRepo.find({ where: { idGondola } });
    
      for (const gp of produtos) {
        const estoqueAtual = await this.getEstoqueAtualDb2({
          idEmpresa: loja.idEmpresa,
          idLocalEstoque: idLocalVenda,
          idProduto: gp.idProduto,
        });
      
        gp.estoqueAtual = estoqueAtual;
        gp.atualizadoEm = new Date();
        await this.gpRepo.save(gp);
      }
    
      return { success: true, total: produtos.length };
    }

    async getReposicaoGondola(idGondola: number): Promise<ReposicaoItem[]> {
      const gondola = await this.gondolaRepo.findOne({ where: { idGondola } });
      if (!gondola) throw new NotFoundException('Gôndola não encontrada');
        
      const loja = await this.lojaRepo.findOne({ where: { idLoja: gondola.idLoja } });
      if (!loja?.idEmpresa) throw new NotFoundException('Loja sem idEmpresa configurado');
        
      const idLocalVenda = await this.getLocalVenda(loja.idLoja);
      if (!idLocalVenda) throw new NotFoundException('Local VENDA não configurado');
        
      const locaisDeposito = await this.getLocaisDeposito(loja.idLoja);
        
      const produtos = await this.gpRepo.find({ where: { idGondola } });
        
      // ✅ TIPADO (resolve o erro do out.push)
      const out: ReposicaoItem[] = [];
        
      for (const gp of produtos) {
        const estoqueVenda = await this.getEstoqueAtualDb2({
          idEmpresa: loja.idEmpresa,
          idLocalEstoque: idLocalVenda,
          idProduto: gp.idProduto,
        });
      
        let estoqueDeposito = 0;
        for (const idLocal of locaisDeposito) {
          estoqueDeposito += await this.getEstoqueAtualDb2({
            idEmpresa: loja.idEmpresa,
            idLocalEstoque: idLocal,
            idProduto: gp.idProduto,
          });
        }
      
        const precisaRepor = Math.max((gp.maximo ?? 0) - estoqueVenda, 0);
        const repor = Math.min(precisaRepor, estoqueDeposito);
      
        out.push({
          idGondolaProduto: gp.idGondolaProduto,
          ean: gp.ean,
          descricao: gp.descricao,
          estoqueVenda,
          minimo: gp.minimo,
          maximo: gp.maximo,
          repor, // 👈 agora bate com o page.tsx
          estoqueDeposito,
        });
      
        // opcional: atualizar o estoqueAtual local com o valor real da VENDA
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

    if (!loja.idEmpresa) {
      throw new BadRequestException('Loja sem idEmpresa configurado (necessário para consultar estoque no DB2).');
    }

    const locais = await this.lojaLocalRepo.find({
      where: { idLoja: loja.idLoja, idEmpresa: loja.idEmpresa },
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
    
    // ✅ calcula o estoque de VENDA no DB2
    const estoqueAtual = await this.getEstoqueAtualDb2({
      idEmpresa: Number(loja.idEmpresa),
      idProduto: idProdutoDb2,
      idLocalEstoque: idLocalVenda,
    });
    
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
      ean: eanDb2, // salva como string (mais seguro)
      descricao: descrDb2,
      minimo: dto.minimo,
      maximo: dto.maximo,
      estoqueAtual,
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
