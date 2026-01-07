// === INÍCIO TRECHO AJUSTADO: src/app.module.ts ===
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Loja } from './lojas/loja.entity';
import { Gondola } from './gondolas/gondola.entity';
import { PosicaoGondola } from './gondolas/posicao-gondola.entity';

import { LojasModule } from './lojas/lojas.module';
import { GondolasModule } from './gondolas/gondolas.module';
import { PosicoesGondolaModule } from './gondolas/posicoes-gondola.module';
import * as dotenv from 'dotenv';
import { Db2Module } from './db2/db2.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AbastecimentosModule } from './abastecimento/abastecimentos.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

dotenv.config();

console.log(
  'DB config =>',
  process.env.DB_HOST,
  process.env.DB_PORT,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  typeof process.env.DB_PASSWORD,
);
@Module({
  imports: [
    AuthModule,
    Db2Module,
    UsuariosModule,
    AbastecimentosModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT), // SÓ aqui usamos Number()
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      schema: 'gondolatrack',
      entities: [Loja, Gondola, PosicaoGondola], // 👈 ADICIONAMOS AQUI
      autoLoadEntities: true,
      synchronize: false,
      logging: true,
    }),

    LojasModule,
    GondolasModule,
    PosicoesGondolaModule, // 👈 garante que o módulo das posições esteja carregado
  ],
})
export class AppModule {}
// === FIM TRECHO AJUSTADO ===
