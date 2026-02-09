// ✅ src/usuarios/usuarios.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Db2Module } from '../db2/db2.module';
import { Usuario } from './usuario.entity';

import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosTenantService } from './usuarios-tenant.service';

// ✅ novos
import { UsuariosAdminController } from './usuarios-admin.controller';
import { UsuariosAdminService } from './usuarios-admin.service';

// ✅ ADICIONAR
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    Db2Module,
    FeatureFlagsModule, // ✅ ESSENCIAL p/ FeatureFlagGuard funcionar aqui
  ],
  controllers: [UsuariosController, UsuariosAdminController],
  providers: [UsuariosService, UsuariosTenantService, UsuariosAdminService],
  exports: [UsuariosTenantService],
})
export class UsuariosModule {}
