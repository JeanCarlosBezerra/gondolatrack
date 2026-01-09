// src/conferencia/conferencias.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferenciasController } from './conferencias.controller';
import { ConferenciasDashboardController } from './conferencias-dashboard.controller';
import { ConferenciasService } from './conferencias.service';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GondolaConferencia, GondolaConferenciaItem]),
  ],
  controllers: [
    ConferenciasController,
    ConferenciasDashboardController,
  ],
  providers: [ConferenciasService],
})
export class ConferenciasModule {}
