// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client } from 'ldapts';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosTenantService } from '../usuarios/usuarios-tenant.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly tenantSvc: UsuariosTenantService,
  ) {}

  async authenticate(usuario: string, senha: string): Promise<{ access_token: string; user: any }> {
    const host   = this.config.get<string>('LDAP_HOST')!;
    const port   = this.config.get<string>('LDAP_PORT')!;
    const baseDN = this.config.get<string>('LDAP_BASE_DN')!;
    const domain = this.config.get<string>('LDAP_DOMAIN')!;

    const url = `ldap://${host}:${port}`;
    const client = new Client({ url });

    try {
      await client.bind(`${usuario}@${domain}`, senha);

      const { searchEntries } = await client.search(baseDN, {
        scope: 'sub',
        filter: `(sAMAccountName=${usuario})`,
        attributes: ['cn', 'memberOf', 'sAMAccountName'],
      });

      if (!searchEntries.length) throw new UnauthorizedException('Usuário não encontrado');

      const entry = searchEntries[0] as any;
      const cn = (entry.cn as string) ?? null;

      const groups = Array.isArray(entry.memberOf)
        ? entry.memberOf
        : entry.memberOf ? [entry.memberOf] : [];

      // >>> TRAVA DE SEGURANÇA: só auto-cadastra se estiver no grupo do AD
      const allowAll = String(this.config.get('GT_ALLOW_AUTO_CADASTRO_ALL') ?? 'false').toLowerCase() === 'true';

      const allowedAutoCadastro =
        allowAll ||
        groups.some((g: string) => String(g).toUpperCase().includes('GONDOLATRACK_USERS'));

      // tenta pegar tenant cadastrado; se não existir, auto-cadastra (se allowed)
      let tenant: { idEmpresa: number; nome: string | null };

      try {
        tenant = await this.tenantSvc.getTenantOrThrow(usuario);
      } catch {
        // DICASA = 1 (seu print confirma)
        tenant = await this.tenantSvc.ensureTenantFromAd({
          username: usuario,
          nome: cn,
          idEmpresaDefault: 1,
          allowed: allowedAutoCadastro,
        });
      }

      await this.tenantSvc.touchName(usuario, cn);

      const payload = {
        username: usuario,
        nome: cn,
        groups,
        idEmpresa: tenant.idEmpresa,
      };

      const token = this.jwtService.sign(payload);

      return { access_token: token, user: payload };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Usuário ou senha inválidos');
    } finally {
      try { await client.unbind(); } catch {}
    }
  }
}
