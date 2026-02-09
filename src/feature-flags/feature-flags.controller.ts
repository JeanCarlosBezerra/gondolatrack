// ✅ src/feature-flags/feature-flags.controller.ts
import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';
import { FEATURE_CATALOG } from './feature-flags.catalog';

@UseGuards(JwtAuthGuard)
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const raw = (req as any)?.user?.idEmpresa;
    const idEmpresa = Number(raw);

    if (!Number.isFinite(idEmpresa)) {
      throw new UnauthorizedException('Usuário sem idEmpresa no token');
    }

    const rows = await this.service.listByEmpresa(idEmpresa);

    // transforma lista em map: { FEATURE_KEY: true/false }
    const flags = (rows ?? []).reduce((acc: Record<string, boolean>, r: any) => {
      const key = String(r.featureKey ?? r.feature_key ?? '');
      if (key) acc[key] = !!(r.enabled ?? r.ENABLED);
      return acc;
    }, {});

    return { ok: true, idEmpresa, flags };
  }

   @Get('catalog')
    async catalog() {
      return {
        items: FEATURE_CATALOG,
      };
    }
}
