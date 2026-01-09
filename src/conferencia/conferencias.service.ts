import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConferenciaDto } from './dto/create-conferencia.dto';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';

@Injectable()
export class ConferenciasService {
  constructor(
    @InjectRepository(GondolaConferencia) private confRepo: Repository<GondolaConferencia>,
    @InjectRepository(GondolaConferenciaItem) private itemRepo: Repository<GondolaConferenciaItem>,
  ) {}

  async getPorId(idGondola: number, idConferencia: number) {
  const conf = await this.confRepo.findOne({
    where: {
      idConferencia,
      idGondola,
    },
    relations: { itens: true },
  });

  if (!conf) {
    throw new NotFoundException('Conferência não encontrada.');
  }

  return conf;
}

  async getUltima(idGondola: number) {
    const ultima = await this.confRepo.findOne({
      where: { idGondola },
      order: { criadoEm: 'DESC' },
      relations: { itens: true },
    });
    
    return ultima ?? null;
  }


async criar(idGondola: number, dto: CreateConferenciaDto, user: any) {
  if (!user?.username) throw new NotFoundException('Usuário não identificado no token.');

  const conf = this.confRepo.create({
    idGondola,
    usuario: user.username,
    nome: user.nome ?? null,
    itens: [],
  });

  conf.itens = (dto.itens ?? []).map((i) => {
    const item = this.itemRepo.create({
      idProduto: i.idProduto != null ? String(i.idProduto) : null,
      ean: i.ean ?? null,
      descricao: i.descricao ?? null,
      qtdConferida: String(i.qtdConferida ?? 0),
    });

    // garante o vínculo (FK)
    item.conferencia = conf;
    return item;
  });

  await this.confRepo.save(conf);
  return this.getUltima(idGondola);
}

}
