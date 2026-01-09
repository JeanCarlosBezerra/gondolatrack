import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConferenciaItemDto {
  @IsOptional() @IsNumber()
  idProduto?: number;

  @IsOptional() @IsString()
  ean?: string;

  @IsOptional() @IsString()
  descricao?: string;

  @IsNumber()
  qtdConferida: number;
}

export class CreateConferenciaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConferenciaItemDto)
  itens: ConferenciaItemDto[];
}
