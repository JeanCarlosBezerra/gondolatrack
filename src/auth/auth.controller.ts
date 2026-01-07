// === INÍCIO ARQUIVO: src/auth/auth.controller.ts ===
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.authenticate(dto.usuario, dto.senha);

    // Cookie (recomendado para evitar ficar guardando token em localStorage)
    res.cookie('gt_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // se for HTTPS em produção, mude pra true
      maxAge: 1000 * 60 * 60 * 8, // 8h
    });

    return { ok: true, user: result.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('gt_token');
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    // req.user vem do JwtStrategy
    return { ok: true, user: (req as any).user };
  }
}
// === FIM ARQUIVO ===
