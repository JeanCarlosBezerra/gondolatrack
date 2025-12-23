// === INÍCIO ARQUIVO AJUSTADO: src/abastecimento/abastecimento.service.ts ===
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GondolaProduto } from '../gondolas/gondola-produto.entity';

@Injectable()
export class AbastecimentoService {
  constructor(
    @InjectRepository(GondolaProduto) private gpRepo: Repository<GondolaProduto>,
  ) {}

  async list(params: { loja?: number; gondola?: number }) {
    const qb = this.gpRepo.createQueryBuilder('gp');

    if (params.loja) qb.andWhere('gp.idLoja = :loja', { loja: params.loja });
    if (params.gondola) qb.andWhere('gp.idGondola = :gondola', { gondola: params.gondola });

    qb.andWhere('gp.estoqueAtual < gp.minimo');

    const rows = await qb.getMany();

    return rows.map(r => ({
      idGondola: r.idGondola,
      idLoja: r.idLoja,
      idProduto: r.idProduto,
      ean: r.ean,
      descricao: r.descricao,
      minimo: r.minimo,
      maximo: r.maximo,
      estoqueAtual: r.estoqueAtual,
      precisaRepor: Math.max(r.minimo - r.estoqueAtual, 0),
    }));
  }
}
// === FIM ===
