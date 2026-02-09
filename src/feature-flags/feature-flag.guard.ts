// === INÍCIO ARQUIVO: src/feature-flags/feature-flag.guard.ts ===
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';

function isAdminRole(req: any): boolean {
  const raw = String(req?.user?.roles ?? '');
  const parts = raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return parts.includes('ADMIN');
}

export function FeatureFlagGuard(featureKey: string): Type<CanActivate> {
  @Injectable()
  class FeatureFlagGuardMixin implements CanActivate {
    constructor(private readonly flagsService: FeatureFlagsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest();

      // ✅ GOD MODE: ADMIN passa direto
      if (isAdminRole(req)) return true;

      const idEmpresa = Number(req?.user?.idEmpresa);
      if (!idEmpresa) {
        throw new ForbiddenException('Empresa do usuário não identificada.');
      }

      const enabled = await this.flagsService.isEnabled(idEmpresa, featureKey);

      if (!enabled) {
        throw new ForbiddenException(`Módulo desativado para esta empresa: ${featureKey}`);
      }

      return true;
    }
  }

  return mixin(FeatureFlagGuardMixin);
}
// === FIM ARQUIVO ===
