// === INÍCIO: src/gondolas/gondolas.controller.ts ===
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateGondolaDto } from './dto/create-gondola.dto';
import { UpdateGondolaDto } from './dto/update-gondola.dto';
import { GondolasService } from './gondolas.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGondolaGuard } from 'src/common/guards/tenant-gondola.guard';
import { FeatureFlagGuard } from 'src/feature-flags/feature-flag.guard';
@UseGuards(JwtAuthGuard, TenantGondolaGuard, FeatureFlagGuard('MOD_GONDOLAS'))
@Controller('gondolas')
export class GondolasController {
  constructor(private readonly gondolasService: GondolasService) {}

  @Get()
  async list(@Query('idLoja') idLoja?: string) {
    return this.gondolasService.list(idLoja ? Number(idLoja) : undefined);
  }

  @Get('all')
  findAll(@Query('idLoja') idLoja?: string) {
    const parsed = idLoja ? Number(idLoja) : undefined;
    return this.gondolasService.findAll(parsed);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gondolasService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateGondolaDto) {
    return this.gondolasService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateGondolaDto) {
    return this.gondolasService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gondolasService.remove(id);
  }
}
// === FIM ===
