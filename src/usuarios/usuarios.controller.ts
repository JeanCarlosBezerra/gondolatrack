import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagGuard } from 'src/feature-flags/feature-flag.guard';
import { UserPermissionGuard } from 'src/common/guards/user-permission.guard';

@UseGuards(JwtAuthGuard, TenantGondolaGuard, FeatureFlagGuard('MOD_CONFIGURACOES'))
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  // ✅ usuários locais (Postgres) - permissões
  @UseGuards(UserPermissionGuard('CFG_USERS_VIEW'))
  @Get()
  listLocal() {
    return this.service.listLocal();
  }

  // ✅ lista do ERP (DB2) - auxiliar
  @UseGuards(UserPermissionGuard('CFG_USERS_VIEW'))
  @Get('erp')
  listErp() {
    return this.service.listErp();
  }

  // ✅ editar roles
  @UseGuards(UserPermissionGuard('CFG_USERS_EDIT'))
  @Put(':id/roles')
  updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roles: string[] },
  ) {
    return this.service.updateRoles(id, body.roles ?? []);
  }
}
