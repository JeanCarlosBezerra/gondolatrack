// src/conferencia/conferencias.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferenciasController } from './conferencias.controller';
import { ConferenciasDashboardController } from './conferencias-dashboard.controller';
import { ConferenciasService } from './conferencias.service';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';
import { Db2Module } from 'src/db2/db2.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GondolaConferencia, GondolaConferenciaItem]),
    Db2Module,
  ],
  controllers: [
    ConferenciasController,
    ConferenciasDashboardController,
  ],
  providers: [ConferenciasService],
})
export class ConferenciasModule {}
