// === INÍCIO ARQUIVO AJUSTADO: src/auth/auth.service.ts ===
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client } from 'ldapts';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async authenticate(usuario: string, senha: string): Promise<{ access_token: string; user: any }> {
    const host   = this.config.get<string>('LDAP_HOST')!;
    const port   = this.config.get<string>('LDAP_PORT')!;
    const baseDN = this.config.get<string>('LDAP_BASE_DN')!;
    const domain = this.config.get<string>('LDAP_DOMAIN')!;

    const url = `ldap://${host}:${port}`;
    const client = new Client({ url });

    try {
      // Bind (AD)
      await client.bind(`${usuario}@${domain}`, senha);

      // Buscar dados do usuário
      const { searchEntries } = await client.search(baseDN, {
        scope: 'sub',
        filter: `(sAMAccountName=${usuario})`,
        attributes: ['cn', 'memberOf', 'sAMAccountName'],
      });

      if (!searchEntries.length) throw new UnauthorizedException('Usuário não encontrado');

      const entry = searchEntries[0] as any;
      const cn = entry.cn as string;

      const groups = Array.isArray(entry.memberOf)
        ? entry.memberOf
        : entry.memberOf
          ? [entry.memberOf]
          : [];

      // Payload do token
      const payload = { username: usuario, nome: cn, groups };

      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: payload,
      };
    } catch (err) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    } finally {
      try { await client.unbind(); } catch {}
    }
  }
}
// === FIM ARQUIVO ===
