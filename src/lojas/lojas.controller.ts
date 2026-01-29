// ✅ src/lojas/lojas.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LojasService } from './lojas.service';
import { Loja } from './loja.entity';
import { CreateLojaDto } from './dto/create-loja.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagGuard } from 'src/feature-flags/feature-flag.guard';
@UseGuards(JwtAuthGuard, TenantGondolaGuard, FeatureFlagGuard('MOD_LOJAS'))
@Controller('lojas')
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  @Get()
  async listar(): Promise<Loja[]> {
    return this.lojasService.listarTodas();
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number): Promise<Loja | null> {
    return this.lojasService.buscarPorId(id);
  }

  @UseGuards(JwtAuthGuard, TenantGondolaGuard, FeatureFlagGuard('MOD_INSERIR_LOJA'))
  @Post()
  async criar(@Body() dto: CreateLojaDto): Promise<Loja> {
    return this.lojasService.criar(dto);
  }

  @Put(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLojaDto,
  ): Promise<Loja> {
    return this.lojasService.atualizar(id, dto);
  }

  @Delete(':id')
  async remover(@Param('id', ParseIntPipe) id: number) {
    return this.lojasService.remover(id);
  }
}
