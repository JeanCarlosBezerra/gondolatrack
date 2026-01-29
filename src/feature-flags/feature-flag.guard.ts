// === INÍCIO ARQUIVO NOVO: src/feature-flags/feature-flag.guard.ts ===
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';

export function FeatureFlagGuard(featureKey: string): Type<CanActivate> {
  @Injectable()
  class FeatureFlagGuardMixin implements CanActivate {
    constructor(private readonly flagsService: FeatureFlagsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest();

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
// === FIM ARQUIVO NOVO ===
