// === INÍCIO: src/gondolas/dto/update-gondola.dto.ts ===

// === ALTERADO: adicionados decorators para ValidationPipe (whitelist) não limpar o body ===
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGondolaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idLoja?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  // null é aceito porque IsOptional considera null/undefined como "vazio"
  @IsOptional()
  @IsString()
  corredorSecao?: string | null;

  @IsOptional()
  @IsString()
  marca?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  totalPosicoes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idResponsavel?: number | null;
}

// === FIM ===
