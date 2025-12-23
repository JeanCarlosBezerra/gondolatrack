// src/gondolas/posicoes-gondola.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PosicaoGondola } from './posicao-gondola.entity';
import { Gondola } from './gondola.entity';
import { CreatePosicaoGondolaDto } from './dto/posicao-gondola.dto';

@Injectable()
export class PosicoesGondolaService {
  constructor(
    @InjectRepository(PosicaoGondola)
    private readonly repo: Repository<PosicaoGondola>,

    @InjectRepository(Gondola)
    private readonly gondolasRepo: Repository<Gondola>,
  ) {}

  async findByGondola(idGondola: number) {
    return this.repo.find({
      where: { gondola: { idGondola } },
      order: { posicao: 'ASC' },
    });
  }

  findAll() {
  return this.repo.find({ order: { posicao: 'ASC' } });
  }

  async create(data: CreatePosicaoGondolaDto) {
    const gondola = await this.gondolasRepo.findOne({
      where: { idGondola: data.idGondola },
    });

    if (!gondola) {
      throw new NotFoundException('Gôndola não encontrada.');
    }

    // Impede duplicação de posição na mesma gôndola
    const posicaoExistente = await this.repo.findOne({
      where: { gondola: { idGondola: data.idGondola }, posicao: data.posicao },
    });

    if (posicaoExistente) {
      throw new BadRequestException(
        `A posição ${data.posicao} já está ocupada nessa gôndola.`,
      );
    }

    const entity = this.repo.create({
      gondola,
      idProduto: data.idProduto,
      posicao: data.posicao,
      estoqueMaximo: data.estoqueMaximo ?? null,
      estoqueAtual: data.estoqueAtual ?? null,
    });

    return this.repo.save(entity);
  }
}
