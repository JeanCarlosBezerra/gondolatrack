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
import { CreateLojaLocalEstoqueDto } from './dto/create-loja-local-estoque.dto';
import { RolesGuard } from "src/common/guards/roles.guard";

// ✅ ALTERADO: removido FeatureFlagGuard('MOD_LOJAS') do nível da classe
@UseGuards(JwtAuthGuard, TenantGondolaGuard)
@Controller('lojas')
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  // =========================
  // LOJAS (módulo lojas)
  // =========================
  @UseGuards(FeatureFlagGuard('MOD_LOJAS'))
  @Get()
  async listar(): Promise<Loja[]> {
    return this.lojasService.listarTodas();
  }

  @UseGuards(FeatureFlagGuard('MOD_LOJAS'))
  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number): Promise<Loja | null> {
    return this.lojasService.buscarPorId(id);
  }

  @UseGuards(FeatureFlagGuard('MOD_INSERIR_LOJA'))
  @Post()
  async criar(@Body() dto: CreateLojaDto): Promise<Loja> {
    return this.lojasService.criar(dto);
  }

  @UseGuards(FeatureFlagGuard('MOD_LOJAS'))
  @Put(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLojaDto,
  ): Promise<Loja> {
    return this.lojasService.atualizar(id, dto);
  }

  @UseGuards(FeatureFlagGuard('MOD_LOJAS'))
  @Delete(':id')
  async remover(@Param('id', ParseIntPipe) id: number) {
    return this.lojasService.remover(id);
  }

  // =========================
  // CONFIGURAÇÕES -> LOCAIS DE ESTOQUE
  // =========================

  // ✅ VIEW: basta ter MOD_CONFIGURACOES (você pode criar CFG_LOCAIS_ESTOQUE_VIEW depois, se quiser)
  @UseGuards(FeatureFlagGuard("MOD_CONFIGURACOES"), RolesGuard("CFG_LOCAIS_ESTOQUE_VIEW"))
  @Get(":idLoja/locais-estoque")
  async listarLocais(@Param('idLoja', ParseIntPipe) idLoja: number) {
    return this.lojasService.listarLocaisEstoque(idLoja);
  }

  // ✅ EDIT: criar precisa CFG_LOCAIS_ESTOQUE_EDIT
  @UseGuards(FeatureFlagGuard("MOD_CONFIGURACOES"), RolesGuard("CFG_LOCAIS_ESTOQUE_EDIT"))
  @Post(":idLoja/locais-estoque")
  async criarLocal(
    @Param('idLoja', ParseIntPipe) idLoja: number,
    @Body() dto: CreateLojaLocalEstoqueDto,
  ) {
    return this.lojasService.criarLocalEstoque(idLoja, dto);
  }

  // ✅ EDIT: remover precisa CFG_LOCAIS_ESTOQUE_EDIT
  @UseGuards(FeatureFlagGuard("MOD_CONFIGURACOES"), RolesGuard("CFG_LOCAIS_ESTOQUE_EDIT"))
  @Delete("locais-estoque/:idLojaLocalEstoque")
  async removerLocal(
    @Param('idLojaLocalEstoque', ParseIntPipe) idLojaLocalEstoque: number,
  ) {
    return this.lojasService.removerLocalEstoque(idLojaLocalEstoque);
  }
}
