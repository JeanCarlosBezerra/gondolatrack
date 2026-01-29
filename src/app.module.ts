// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { Db2Module } from './db2/db2.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AbastecimentosModule } from './abastecimento/abastecimentos.module';
import { LojasModule } from './lojas/lojas.module';
import { GondolasModule } from './gondolas/gondolas.module';
import { PosicoesGondolaModule } from './gondolas/posicoes-gondola.module';

import { Loja } from './lojas/loja.entity';
import { Gondola } from './gondolas/gondola.entity';
import { PosicaoGondola } from './gondolas/posicao-gondola.entity';
import { ConferenciasModule } from './conferencia/conferencias.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    AuthModule,
    Db2Module,
    UsuariosModule,
    AbastecimentosModule,

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      schema: 'gondolatrack',
      entities: [Loja, Gondola, PosicaoGondola],
      autoLoadEntities: true,
      synchronize: false,
      logging: true,
    }),

    LojasModule,
    GondolasModule,
    PosicoesGondolaModule,
    ConferenciasModule,
    FeatureFlagsModule,
  ],
})
export class AppModule {}
