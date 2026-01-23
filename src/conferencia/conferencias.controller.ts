// exemplo: src/conferencia/conferencias.controller.ts
import { Controller, Get, Param, ParseIntPipe, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ConferenciasService } from './conferencias.service';
import { CreateConferenciaDto } from './dto/create-conferencia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('gondolas')
export class ConferenciasController {
  constructor(private readonly service: ConferenciasService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':idGondola/conferencia/ultima')
  async ultima(@Param('idGondola', ParseIntPipe) idGondola: number) {
    const ultima = await this.service.getUltima(idGondola);
    return { ok: true, data: ultima }; // data pode ser null
  }

  @UseGuards(JwtAuthGuard)
  @Get(':idGondola/conferencia/:idConferencia')
  async porId(
    @Param('idGondola', ParseIntPipe) idGondola: number,
    @Param('idConferencia', ParseIntPipe) idConferencia: number,
  ) {
    return this.service.getPorId(idGondola, idConferencia);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':idGondola/conferencia')
  criar(
    @Param('idGondola', ParseIntPipe) idGondola: number,
    @Body() dto: CreateConferenciaDto,
    @Req() req: Request,
  ) {
    return this.service.criar(idGondola, dto, (req as any).user);
  }

   @UseGuards(JwtAuthGuard)
  @Get(':idGondola/conferencia/:idConferencia/divergencias')
  async divergencias(
    @Param('idGondola', ParseIntPipe) idGondola: number,
    @Param('idConferencia', ParseIntPipe) idConferencia: number,
  ) {
    return this.service.getDivergencias(idGondola, idConferencia);
  }
}
