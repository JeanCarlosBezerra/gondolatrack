// ✅ src/lojas/lojas.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loja } from './loja.entity';
import { CreateLojaDto } from './dto/create-loja.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { LojaLocalEstoque } from './loja-local-estoque.entity';
import { CreateLojaLocalEstoqueDto } from './dto/create-loja-local-estoque.dto'; // === ADICIONADO ===

@Injectable()
export class LojasService {
  constructor(
    @InjectRepository(Loja)
    private readonly repo: Repository<Loja>,
    @InjectRepository(LojaLocalEstoque)
    private readonly lojaLocalEstoqueRepo: Repository<LojaLocalEstoque>,
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

  async listarLocaisEstoque(idLoja: number) {
    return this.lojaLocalEstoqueRepo.find({
      where: { idLoja },
      order: { papelNaLoja: 'ASC' },
    });
  }

  async criarLocalEstoque(idLoja: number, dto: CreateLojaLocalEstoqueDto) {
    // valida se a loja existe (boa prática)
    const loja = await this.repo.findOne({ where: { idLoja } });
    if (!loja) throw new NotFoundException('Loja não encontrada');

    const entity = this.lojaLocalEstoqueRepo.create({
      idLoja,
      idEmpresa: dto.idEmpresa,
      idLocalEstoque: dto.idLocalEstoque,
      papelNaLoja: dto.papelNaLoja,
    });

    try {
      return await this.lojaLocalEstoqueRepo.save(entity);
    } catch (e: any) {
      // Unique uq_loja_local => evita duplicado
      const msg = String(e?.detail ?? e?.message ?? '');
      if (msg.includes('uq_loja_local') || msg.toLowerCase().includes('duplicate')) {
        throw new BadRequestException(
          'Já existe esse Local de Estoque para esta loja/empresa.',
        );
      }
      throw e;
    }
  }

  // === ADICIONADO: remover local de estoque ===
  async removerLocalEstoque(idLojaLocalEstoque: number) {
    const existing = await this.lojaLocalEstoqueRepo.findOne({
      where: { idLojaLocalEstoque },
    });
    if (!existing) throw new NotFoundException('Local de estoque não encontrado');

    await this.lojaLocalEstoqueRepo.delete({ idLojaLocalEstoque });
    return { success: true };
  }
}

