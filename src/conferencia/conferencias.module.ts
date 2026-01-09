import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferenciasService } from './conferencias.service';
import { ConferenciasController } from './conferencias.controller';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GondolaConferencia, GondolaConferenciaItem])],
  providers: [ConferenciasService],
  controllers: [ConferenciasController],
})
export class ConferenciasModule {}
