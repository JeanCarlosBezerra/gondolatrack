// === INÍCIO ARQUIVO NOVO: src/produtos/produtos.controller.ts ===
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagGuard } from 'src/feature-flags/feature-flag.guard';
import { ProdutosService } from './produtos.service';

@UseGuards(JwtAuthGuard, TenantGondolaGuard, FeatureFlagGuard('MOD_CATALOGO_PRODUTOS'))
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  @Get('search')
  async search(
    @Query('idLoja') idLoja: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.search({
      idLoja: Number(idLoja),
      q: (q ?? '').trim(),
      page: Number(page ?? 1),
      limit: Number(limit ?? 50),
    });
  }

  @Get('sem-gondola')
  async semGondola(
    @Query('idLoja') idLoja: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.semGondola({
      idLoja: Number(idLoja),
      q: (q ?? '').trim(),
      page: Number(page ?? 1),
      limit: Number(limit ?? 50),
    });
  }
}
// === FIM ARQUIVO NOVO ===
