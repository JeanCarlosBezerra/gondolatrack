import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from "@nestjs/common";

function parseRoles(raw: any): Set<string> {
  return new Set(
    String(raw ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
  );
}

export function RolesGuard(required: string): Type<CanActivate> {
  @Injectable()
  class RolesGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      const roles = parseRoles(req?.user?.roles);

      if (roles.has("ADMIN")) return true;
      if (roles.has(required.toUpperCase())) return true;

      throw new ForbiddenException(`Sem permissão: ${required}`);
    }
  }

  return mixin(RolesGuardMixin);
}
