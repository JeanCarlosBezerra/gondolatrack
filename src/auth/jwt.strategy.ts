// === INÍCIO ARQUIVO AJUSTADO: src/auth/jwt.strategy.ts ===
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

function cookieExtractor(req: any): string | null {
  if (!req) return null;
  return req.cookies?.gt_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    // --- ALTERAÇÃO: garantir secret sempre definido antes do super() ---
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET não definido no .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
// === FIM ARQUIVO AJUSTADO ===
