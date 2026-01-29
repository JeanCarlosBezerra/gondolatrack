// === INÍCIO ARQUIVO: src/abastecimentos/abastecimentos.controller.ts ===
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AbastecimentosService } from "./abastecimentos.service";
import { GerarAbastecimentoDto } from "./dto/gerar-abastecimento.dto";
import { AtualizarItensDto } from "./dto/atualizar-itens.dto";
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagGuard } from 'src/feature-flags/feature-flag.guard';

@UseGuards(JwtAuthGuard, TenantGondolaGuard, FeatureFlagGuard('MOD_ABASTECIMENTO'))
@Controller("abastecimentos")
export class AbastecimentosController {
  constructor(private readonly service: AbastecimentosService) {}

  // === JÁ EXISTIA ===
  @Post("gerar")
  async gerar(@Body() dto: GerarAbastecimentoDto) {
    return this.service.gerar(dto);
  }

  // === NOVO: LISTAR ABASTECIMENTOS (por loja opcional) ===
  @Get()
  async list(@Query("idLoja") idLoja?: string) {
    const n = idLoja ? Number(idLoja) : undefined;
    return this.service.list(n);
  }

  // === NOVO: LISTAR ITENS DO ABASTECIMENTO ===
  @Get(":idAbastecimento/itens")
  async itens(@Param("idAbastecimento") idAbastecimento: string) {
    return this.service.itens(idAbastecimento);
  }


  @Patch(":idAbastecimento/itens")
  async salvarItens(
    @Param("idAbastecimento") idAbastecimento: string,
    @Body() body: { itens: { idAbastecimentoItem: string; qtdSelecionada: string }[] },
  ) {
    return this.service.salvarItens(idAbastecimento, body);
  }

  @Post(":idAbastecimento/confirmar")
  async confirmar(@Param("idAbastecimento") idAbastecimento: string) {
    return this.service.confirmar(idAbastecimento);
  }

  // === NOVO: IMPRIMIR (HTML) ===
  @Get(":idAbastecimento/print")
  async print(
    @Param("idAbastecimento") idAbastecimento: string,
    @Res() res: Response,
  ) {
    const html = await this.service.gerarHtmlImpressao(idAbastecimento);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  }

@Get(":idAbastecimento/export/xlsx")
async exportXlsx(
  @Param("idAbastecimento") idAbastecimento: string,
  @Res() res: Response,
) {
  const { buffer, filename } = await this.service.exportarXlsx(idAbastecimento);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);

  return res.end(buffer);
}
}
// === FIM ARQUIVO ===
