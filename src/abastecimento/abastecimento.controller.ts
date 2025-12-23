// === INÍCIO ARQUIVO: src/abastecimento/abastecimento.controller.ts ===
import { Controller, Get, Query } from '@nestjs/common';
import { AbastecimentoService } from './abastecimento.service';

@Controller('api/abastecimento')
export class AbastecimentoController {
  constructor(private readonly service: AbastecimentoService) {}

  @Get()
  async list(@Query('loja') loja?: string, @Query('gondola') gondola?: string) {
    return this.service.list({
      loja: loja ? Number(loja) : undefined,
      gondola: gondola ? Number(gondola) : undefined,
    });
  }
}
// === FIM ARQUIVO ===
