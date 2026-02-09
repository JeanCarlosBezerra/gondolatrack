// === INÍCIO ARQUIVO: src/lojas/dto/create-loja-local-estoque.dto.ts ===
import { IsIn, IsInt, Min } from 'class-validator';

export class CreateLojaLocalEstoqueDto {
  @IsInt()
  @Min(1)
  idEmpresa: number;

  @IsInt()
  @Min(1)
  idLocalEstoque: number;

  @IsIn(['VENDA', 'DEPOSITO', 'CD'])
  papelNaLoja: 'VENDA' | 'DEPOSITO' | 'CD';
}
// === FIM ARQUIVO ===
