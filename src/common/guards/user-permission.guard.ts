import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';

function parseRoles(roles: any): string[] {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.map(String);
  return String(roles)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function UserPermissionGuard(permissionKey: string): Type<CanActivate> {
  @Injectable()
  class UserPermissionGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      const roles = parseRoles(req?.user?.roles);

      // ✅ GOD MODE
      if (roles.includes('ADMIN')) return true;

      if (!roles.includes(permissionKey)) {
        throw new ForbiddenException(`Sem permissão: ${permissionKey}`);
      }

      return true;
    }
  }

  return mixin(UserPermissionGuardMixin);
}
