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
} from "@nestjs/common";
import type { Response } from "express";
import { AbastecimentosService } from "./abastecimentos.service";
import { GerarAbastecimentoDto } from "./dto/gerar-abastecimento.dto";
import { AtualizarItensDto } from "./dto/atualizar-itens.dto";

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

  // === NOVO: SALVAR qtdSelecionada EM LOTE ===
  @Patch(":idAbastecimento/itens")
  async atualizarItens(
    @Param("idAbastecimento") idAbastecimento: string,
    @Body() dto: AtualizarItensDto,
  ) {
    return this.service.atualizarItensSelecionados(idAbastecimento, dto);
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
}
// === FIM ARQUIVO ===
