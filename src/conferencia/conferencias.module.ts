// src/conferencia/conferencias.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferenciasController } from './conferencias.controller';
import { ConferenciasDashboardController } from './conferencias-dashboard.controller';
import { ConferenciasService } from './conferencias.service';
import { GondolaConferencia } from './entities/gondola-conferencia.entity';
import { GondolaConferenciaItem } from './entities/gondola-conferencia-item.entity';
import { Db2Module } from 'src/db2/db2.module';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagsModule } from 'src/feature-flags/feature-flags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GondolaConferencia, GondolaConferenciaItem]),
    Db2Module,
    FeatureFlagsModule,
  ],
  controllers: [
    ConferenciasController,
    ConferenciasDashboardController,
  ],
  providers: [ConferenciasService,TenantGondolaGuard],
})
export class ConferenciasModule {}
