// === INÍCIO ARQUIVO: src/abastecimentos/abastecimentos.controller.ts ===
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AbastecimentosService } from "./abastecimentos.service";
import { GerarAbastecimentoDto } from "./dto/gerar-abastecimento.dto";

@Controller("/api/abastecimentos")
export class AbastecimentosController {
  constructor(private readonly service: AbastecimentosService) {}

  @Post("gerar")
  async gerar(@Body() dto: GerarAbastecimentoDto) {
    return this.service.gerar(dto);
  }

  // === ADICIONADO: listar últimos abastecimentos (opcional filtrar por loja) ===
  @Get()
  async list(@Query("idLoja") idLoja?: string) {
    const parsed = idLoja ? Number(idLoja) : undefined;
    return this.service.list(parsed);
  }

  // === ADICIONADO: listar itens de um abastecimento ===
  @Get(":idAbastecimento/itens")
  async itens(@Param("idAbastecimento") idAbastecimento: string) {
    return this.service.itens(idAbastecimento);
  }
}
// === FIM ARQUIVO ===
