// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/gondolas.module.ts ===

// [ALTERADO] adicionar Db2Module
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Db2Module } from '../db2/db2.module'; // <<<<<< [ALTERADO]

import { Gondola } from './gondola.entity';
import { GondolaProduto } from './gondola-produto.entity';
import { PosicaoGondola } from './posicao-gondola.entity';

import { GondolasController } from './gondolas.controller';
import { GondolaProdutosController } from './gondola-produtos.controller';
import { PosicoesGondolaController } from './posicoes-gondola.controller';

import { GondolasService } from './gondolas.service';
import { GondolaProdutosService } from './gondola-produtos.service';
import { PosicoesGondolaService } from './posicoes-gondola.service';

import { Loja } from '../lojas/loja.entity';
import { LojaLocalEstoque } from '../lojas/loja-local-estoque.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gondola,
      GondolaProduto,
      PosicaoGondola,
      Loja,
      LojaLocalEstoque,
    ]),
    Db2Module, // <<<<<< [ALTERADO] isso resolve o DI do Db2Service
  ],
  controllers: [
    GondolasController,
    GondolaProdutosController,
    PosicoesGondolaController,
  ],
  providers: [
    GondolasService,
    GondolaProdutosService,
    PosicoesGondolaService,
  ],
})
export class GondolasModule {}
// === FIM ARQUIVO AJUSTADO ===
