// === INÍCIO ARQUIVO AJUSTADO: src/auth/auth.module.ts ===
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import type { StringValue } from "ms";
import { UsuariosModule } from 'src/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UsuariosModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
          const secret = config.get<string>('JWT_SECRET');
          if (!secret) {
            throw new Error('JWT_SECRET não definido no .env');
          }
      
          // Em vez de "8h", use segundos para evitar conflito de tipos
          // 8h = 8 * 60 * 60 = 28800
          const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ?? '8h') as StringValue;
          
          return {
            secret,
            signOptions: { expiresIn },
          };
        },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
// === FIM ARQUIVO AJUSTADO ===
