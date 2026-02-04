// === INÍCIO: src/gondolas/gondolas.service.ts ===
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Gondola } from './gondola.entity';
import { CreateGondolaDto } from './dto/create-gondola.dto';
import { UpdateGondolaDto } from './dto/update-gondola.dto';
import { LojaLocalEstoque } from 'src/lojas/loja-local-estoque.entity';

@Injectable()
export class GondolasService {
  constructor(
    @InjectRepository(Gondola)
    private readonly gondolasRepo: Repository<Gondola>,

    // === ALTERADO: repo de LojaLocalEstoque injetado corretamente
    @InjectRepository(LojaLocalEstoque)
    private readonly lojaLocalEstoqueRepo: Repository<LojaLocalEstoque>,
  ) {}

  async list(idLoja?: number) {
    if (idLoja) {
      return this.gondolasRepo.find({
        where: { idLoja },
        order: { idGondola: 'DESC' as any },
      });
    }

    return this.gondolasRepo.find({
      order: { idGondola: 'DESC' as any },
    });
  }

  findAll(idLoja?: number) {
    if (idLoja) {
      return this.gondolasRepo.find({
        where: { idLoja },
        order: { nome: 'ASC' },
      });
    }

    return this.gondolasRepo.find({
      order: { nome: 'ASC' },
    });
  }

  findOne(idGondola: number) {
    return this.gondolasRepo.findOne({
      where: { idGondola },
    });
  }

  async create(dto: CreateGondolaDto) {
    // === ALTERADO: valida o local de estoque dentro do método create()
    if (!dto.idLojaLocalEstoque) {
      throw new BadRequestException('Informe o local de estoque.');
    }

    const local = await this.lojaLocalEstoqueRepo.findOne({
      where: {
        idLojaLocalEstoque: dto.idLojaLocalEstoque,
        idLoja: dto.idLoja,
      },
    });

    if (!local) {
      throw new BadRequestException(
        'Local de estoque inválido para a loja selecionada',
      );
    }

    const entity = this.gondolasRepo.create({
      idLoja: dto.idLoja,
      idLojaLocalEstoque: dto.idLojaLocalEstoque, // === ALTERADO: salva o vínculo
      nome: dto.nome,
      corredorSecao: dto.corredorSecao ?? null,
      marca: dto.marca ?? null,
      totalPosicoes: dto.totalPosicoes ?? 20,
      idResponsavel: dto.idResponsavel ?? null,
    });

    return this.gondolasRepo.save(entity);
  }

  async update(id: number, dto: UpdateGondolaDto) {
    const gondola = await this.gondolasRepo.findOne({
      where: { idGondola: id },
    });
    if (!gondola) {
      throw new NotFoundException('Gôndola não encontrada');
    }

    const dataToUpdate: Partial<Gondola> = {};

    if (dto.nome !== undefined) dataToUpdate.nome = dto.nome;
    if (dto.idLoja !== undefined) dataToUpdate.idLoja = dto.idLoja;
    if (dto.corredorSecao !== undefined)
      dataToUpdate.corredorSecao = dto.corredorSecao;
    if (dto.marca !== undefined) dataToUpdate.marca = dto.marca;
    if (dto.totalPosicoes !== undefined)
      dataToUpdate.totalPosicoes = dto.totalPosicoes;
    if (dto.idResponsavel !== undefined)
      dataToUpdate.idResponsavel = dto.idResponsavel;

    // === ALTERADO: se veio idLojaLocalEstoque, valida e atualiza
    if (dto.idLojaLocalEstoque !== undefined) {
      if (!dto.idLojaLocalEstoque) {
        throw new BadRequestException('Informe o local de estoque.');
      }

      const idLojaFinal = dto.idLoja ?? gondola.idLoja;

      const local = await this.lojaLocalEstoqueRepo.findOne({
        where: {
          idLojaLocalEstoque: dto.idLojaLocalEstoque,
          idLoja: idLojaFinal,
        },
      });

      if (!local) {
        throw new BadRequestException(
          'Local de estoque inválido para a loja selecionada',
        );
      }

      dataToUpdate.idLojaLocalEstoque = dto.idLojaLocalEstoque;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('Nenhum campo válido para atualização');
    }

    await this.gondolasRepo.update({ idGondola: id }, dataToUpdate);

    return this.gondolasRepo.findOne({ where: { idGondola: id } });
  }

  async remove(idGondola: number) {
    await this.gondolasRepo.delete({ idGondola });
    return { success: true };
  }
}
// === FIM ===
