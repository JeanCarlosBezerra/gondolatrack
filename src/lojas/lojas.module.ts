// src/lojas/lojas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LojasController } from './lojas.controller';
import { LojasService } from './lojas.service';
import { Loja } from './loja.entity';

import { FeatureFlagsModule } from 'src/feature-flags/feature-flags.module'; // ✅ [ALTERADO]

@Module({
  imports: [
    TypeOrmModule.forFeature([Loja]),
    FeatureFlagsModule, // ✅ [ALTERADO]
  ],
  controllers: [LojasController],
  providers: [LojasService],
})
export class LojasModule {}
