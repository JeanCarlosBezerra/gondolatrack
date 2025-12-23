// ✅ src/lojas/lojas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loja } from './loja.entity';
import { CreateLojaDto } from './dto/create-loja.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';

@Injectable()
export class LojasService {
  constructor(
    @InjectRepository(Loja)
    private readonly repo: Repository<Loja>,
  ) {}

  listarTodas() {
    return this.repo.find({ order: { nome: 'ASC' } });
  }

  buscarPorId(idLoja: number) {
    return this.repo.findOne({ where: { idLoja } });
  }

  async criar(dto: CreateLojaDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async atualizar(idLoja: number, dto: UpdateLojaDto) {
    await this.repo.update({ idLoja }, dto);
    const updated = await this.buscarPorId(idLoja);
    if (!updated) throw new NotFoundException('Loja não encontrada');
    return updated;
  }

  async remover(idLoja: number) {
    await this.repo.delete({ idLoja });
    return { success: true };
  }
}
