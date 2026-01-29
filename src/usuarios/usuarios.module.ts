import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Db2Module } from '../db2/db2.module'; // ✅ ADICIONAR

import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosTenantService } from './usuarios-tenant.service';
import { Usuario } from './usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    Db2Module, // ✅ ADICIONAR (resolve Db2Service no UsuariosService)
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosTenantService],
  exports: [UsuariosTenantService],
})
export class UsuariosModule {}
