// src/lojas/dto/create-loja.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLojaDto {
  @IsString()
  @IsNotEmpty()
  codigoErp: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsInt()
  idEmpresa?: number;
}