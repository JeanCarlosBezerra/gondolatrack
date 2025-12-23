// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/posicoes-gondola.module.ts ===
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PosicaoGondola } from './posicao-gondola.entity';
import { Gondola } from './gondola.entity';

import { PosicoesGondolaService } from './posicoes-gondola.service';
import { PosicoesGondolaController } from './posicoes-gondola.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PosicaoGondola, Gondola])],
  providers: [PosicoesGondolaService],
  controllers: [PosicoesGondolaController],
})
export class PosicoesGondolaModule {}
// === FIM ARQUIVO AJUSTADO ===
