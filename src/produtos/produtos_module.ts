// === INÍCIO ARQUIVO: src/produtos/produtos.module.ts (ALTERADO) ===
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';

import { Db2Module } from 'src/db2/db2.module';
import { FeatureFlagsModule } from 'src/feature-flags/feature-flags.module';

import { Loja } from 'src/lojas/loja.entity';
import { LojaLocalEstoque } from 'src/lojas/loja-local-estoque.entity';
import { GondolaProduto } from 'src/gondolas/gondola-produto.entity';

@Module({
  imports: [
    Db2Module,                 // >>> necessário pro Db2Service
    FeatureFlagsModule,         // >>> necessário pro FeatureFlagGuard
    TypeOrmModule.forFeature([  // >>> repositories do Postgres
      Loja,
      LojaLocalEstoque,
      GondolaProduto,
    ]),
  ],
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}
// === FIM ARQUIVO ===
