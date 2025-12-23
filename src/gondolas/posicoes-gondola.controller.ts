// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/posicoes-gondola.controller.ts ===
import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { PosicoesGondolaService } from './posicoes-gondola.service';
import { CreatePosicaoGondolaDto } from './dto/posicao-gondola.dto';

@Controller('posicoes-gondola')
export class PosicoesGondolaController {
  constructor(private readonly service: PosicoesGondolaService) {}

  @Get()
  find(@Query('idGondola') idGondola?: string) {
    // === ALTERADO: idGondola agora é opcional ===
    if (!idGondola) return this.service.findAll();

    const parsed = Number(idGondola);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('idGondola inválido');
    }
    return this.service.findByGondola(parsed);
  }

  @Post()
  create(@Body() body: CreatePosicaoGondolaDto) {
    return this.service.create(body);
  }
}
// === FIM ===
