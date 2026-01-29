import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantGondolaGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<any>();

    const idEmpresaToken = Number(req?.user?.idEmpresa);
    if (!Number.isFinite(idEmpresaToken)) {
      throw new ForbiddenException('Token sem idEmpresa.');
    }

    const idGondola = Number(req?.params?.idGondola);
    if (!Number.isFinite(idGondola)) return true;

    const rows = await this.dataSource.query(
      `
      SELECT l.id_empresa_tenant
        FROM gondolatrack.gondolas g
        JOIN gondolatrack.lojas   l ON l.id_loja = g.id_loja
       WHERE g.id_gondola = $1
       LIMIT 1
      `,
      [idGondola],
    );

    const idEmpresaDona = Number(rows?.[0]?.id_empresa_tenant);

    if (!Number.isFinite(idEmpresaDona) || idEmpresaDona !== idEmpresaToken) {
      throw new ForbiddenException('Acesso negado: gôndola não pertence à sua empresa.');
    }

    return true;
  }
}
