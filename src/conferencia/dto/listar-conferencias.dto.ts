// src/conferencia/dto/listar-conferencias.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class ListarConferenciasDto {
  @IsOptional() @IsString()
  idLoja?: string;

  @IsOptional() @IsString()
  idGondola?: string;

  @IsOptional() @IsString()
  usuario?: string;

  @IsOptional() @IsString()
  dtIni?: string; // YYYY-MM-DD

  @IsOptional() @IsString()
  dtFim?: string; // YYYY-MM-DD
}
