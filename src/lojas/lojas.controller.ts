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
} from '@nestjs/common';
import { LojasService } from './lojas.service';
import { Loja } from './loja.entity';
import { CreateLojaDto } from './dto/create-loja.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';

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
