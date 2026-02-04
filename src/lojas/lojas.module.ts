// === INÍCIO ARQUIVO: src/lojas/lojas.module.ts ===
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LojasController } from './lojas.controller';
import { LojasService } from './lojas.service';

import { Loja } from './loja.entity';
import { LojaLocalEstoque } from './loja-local-estoque.entity';

// === ADICIONAR: importar o módulo de feature flags (ajuste o path se necessário)
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  // === ALTERADO: incluir LojaLocalEstoque no forFeature
  // === ALTERADO: importar FeatureFlagsModule para resolver FeatureFlagsService
  imports: [
    TypeOrmModule.forFeature([Loja, LojaLocalEstoque]),
    FeatureFlagsModule,
  ],
  controllers: [LojasController],
  providers: [LojasService],
  exports: [LojasService],
})
export class LojasModule {}
// === FIM ARQUIVO ===
