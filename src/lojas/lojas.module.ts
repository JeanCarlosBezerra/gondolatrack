// === INÍCIO: src/lojas/lojas.module.ts ===
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Loja } from './loja.entity';
import { LojasService } from './lojas.service';
import { LojasController } from './lojas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Loja])],
  providers: [LojasService],
  controllers: [LojasController],
})
export class LojasModule {}
// === FIM ===
