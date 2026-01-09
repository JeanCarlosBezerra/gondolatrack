// === INÍCIO ARQUIVO NOVO: src/conferencia/conferencias-dashboard.controller.ts ===
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConferenciasService } from './conferencias.service';
import { ListarConferenciasDto } from './dto/listar-conferencias.dto';

@Controller('conferencias')
export class ConferenciasDashboardController {
  constructor(private readonly service: ConferenciasService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listar(@Query() q: ListarConferenciasDto) {
    const data = await this.service.listar(q);
    return { ok: true, data };
  }
}
// === FIM ARQUIVO NOVO ===
