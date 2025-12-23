// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/dto/add-produto-gondola.dto.ts ===
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddProdutoGondolaDto {
  @IsNotEmpty({ message: 'Informe o EAN.' })
  ean: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Informe o mínimo.' })
  @Min(0, { message: 'Mínimo não pode ser negativo.' })
  minimo: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Informe o máximo.' })
  @Min(0, { message: 'Máximo não pode ser negativo.' })
  maximo: number;
}
// === FIM ARQUIVO AJUSTADO ===
