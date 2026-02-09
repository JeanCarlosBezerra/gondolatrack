import { Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagGuard } from 'src/feature-flags/feature-flag.guard';
import { UsuariosAdminService } from './usuarios-admin.service';
import { UpdateUsuarioAdminDto } from './dto/update-usuario-admin.dto';

@UseGuards(JwtAuthGuard, TenantGondolaGuard)
@Controller('usuarios-admin')
export class UsuariosAdminController {
  constructor(private readonly service: UsuariosAdminService) {}

  @UseGuards(FeatureFlagGuard('CFG_USERS_VIEW'))
  @Get()
  async list(@Req() req: Request) {
    const idEmpresa = Number((req as any)?.user?.idEmpresa);
    return this.service.listByEmpresa(idEmpresa);
  }

  @UseGuards(FeatureFlagGuard('CFG_USERS_EDIT'))
  @Patch(':idUsuario')
  async update(
    @Req() req: Request,
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Body() dto: UpdateUsuarioAdminDto,
  ) {
    const idEmpresa = Number((req as any)?.user?.idEmpresa);
    return this.service.update(idEmpresa, idUsuario, dto);
  }
}
