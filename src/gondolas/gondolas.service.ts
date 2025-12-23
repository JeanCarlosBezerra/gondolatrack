// === INÍCIO: src/gondolas/gondolas.service.ts ===
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gondola } from './gondola.entity';
import { CreateGondolaDto } from './dto/create-gondola.dto';
import { UpdateGondolaDto } from './dto/update-gondola.dto';

@Injectable()
export class GondolasService {
  constructor(
    @InjectRepository(Gondola)
    private readonly gondolasRepo: Repository<Gondola>,
  ) {}

  // Lista todas ou filtra por loja
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
    const entity = this.gondolasRepo.create({
      idLoja: dto.idLoja,
      nome: dto.nome,
      corredorSecao: dto.corredorSecao ?? null,
      marca: dto.marca ?? null,
      totalPosicoes: dto.totalPosicoes ?? 20,

      // IMPORTANTE: mapear para o nome do campo da Entity
      idResponsavel: dto.idResponsavel ?? null,
    });

    return this.gondolasRepo.save(entity);
  }

  async update(id: number, dto: UpdateGondolaDto) {
  const gondola = await this.gondolasRepo.findOne({ where: { idGondola: id } });
  if (!gondola) {
    throw new NotFoundException('Gôndola não encontrada');
  }

  // === ALTERADO: montar payload só com campos presentes (undefined não entra) ===
  const dataToUpdate: Partial<Gondola> = {};

  if (dto.nome !== undefined) dataToUpdate.nome = dto.nome;
  if (dto.idLoja !== undefined) dataToUpdate.idLoja = dto.idLoja;
  if (dto.corredorSecao !== undefined) dataToUpdate.corredorSecao = dto.corredorSecao;
  if (dto.marca !== undefined) dataToUpdate.marca = dto.marca;
  if (dto.totalPosicoes !== undefined) dataToUpdate.totalPosicoes = dto.totalPosicoes;
  if (dto.idResponsavel !== undefined) dataToUpdate.idResponsavel = dto.idResponsavel;

  if (Object.keys(dataToUpdate).length === 0) {
    throw new BadRequestException('Nenhum campo válido para atualização');
  }

  // === ALTERADO: atualizar pela PK correta (idGondola), não por "id" ===
  await this.gondolasRepo.update({ idGondola: id }, dataToUpdate);

  return this.gondolasRepo.findOne({ where: { idGondola: id } });
}

  async remove(idGondola: number) {
    await this.gondolasRepo.delete({ idGondola });
    return { success: true };
  }
}
// === FIM ===
