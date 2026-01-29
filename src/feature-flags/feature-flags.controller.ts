import { Body, Controller, Get, Param, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';
import { SetFeatureFlagDto } from './dto/set-feature-flag.dto';

@UseGuards(JwtAuthGuard)
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get('me')
@Get('me')
    async me(@Req() req: Request) {
      const raw = (req as any)?.user?.idEmpresa;
      const idEmpresa = Number(raw);
    
      if (!Number.isFinite(idEmpresa)) {
        // evita 500 e deixa claro que é auth/payload
        throw new UnauthorizedException('Usuário sem idEmpresa no token');
      }
  
      return {
        ok: true,
        idEmpresa,
        flags: {
          MOD_LOJAS: await this.service.isEnabled(idEmpresa, 'MOD_LOJAS'),
          MOD_GONDOLAS: await this.service.isEnabled(idEmpresa, 'MOD_GONDOLAS'),
          MOD_PRODUTOS: await this.service.isEnabled(idEmpresa, 'MOD_PRODUTOS'),
          MOD_PRODUTOS_GONDOLA: await this.service.isEnabled(idEmpresa, 'MOD_PRODUTOS_GONDOLA'),
          MOD_CATALOGO_PRODUTOS: await this.service.isEnabled(idEmpresa, 'MOD_CATALOGO_PRODUTOS'),
          MOD_ABASTECIMENTO: await this.service.isEnabled(idEmpresa, 'MOD_ABASTECIMENTO'),
          MOD_CONFERENCIAS: await this.service.isEnabled(idEmpresa, 'MOD_CONFERENCIAS'),
          MOD_RELATORIOS: await this.service.isEnabled(idEmpresa, 'MOD_RELATORIOS'),
        
          // ação específica:
          MOD_INSERIR_LOJA: await this.service.isEnabled(idEmpresa, 'MOD_INSERIR_LOJA'),
        },
      };
    }

  @Get(':idEmpresa')
  async list(@Param('idEmpresa') idEmpresa: string) {
    return this.service.listByEmpresa(Number(idEmpresa));
  }

  @Put(':idEmpresa/:featureKey')
  async set(
    @Param('idEmpresa') idEmpresa: string,
    @Param('featureKey') featureKey: string,
    @Body() dto: SetFeatureFlagDto,
  ) {
    return this.service.setFlag(Number(idEmpresa), featureKey, !!dto.enabled);
  }
}
