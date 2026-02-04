import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateGondolaDto {
  @IsInt()
  @Min(1)
  idLoja: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  corredorSecao?: string | null;

  @IsOptional()
  @IsString()
  marca?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalPosicoes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idResponsavel?: number;

  @IsInt()
  @Min(1)
  idLojaLocalEstoque: number;
}
