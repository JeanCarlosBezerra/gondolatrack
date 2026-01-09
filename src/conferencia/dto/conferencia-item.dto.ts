import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConferenciaItemDto {
  @IsOptional()
  @IsNumber()
  idGondolaProduto?: number;

  @IsOptional()
  @IsString()
  ean?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  // aceita decimal, valida como string numérica
  @IsString()
  qtdConferida: string;

  @IsOptional()
  @IsString()
  estoqueAtual?: string;
}
