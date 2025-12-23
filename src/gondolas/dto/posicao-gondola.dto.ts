// src/gondolas/dto/posicao-gondola.dto.ts
export class CreatePosicaoGondolaDto {
  idGondola: number;
  idProduto: number;
  posicao: number;
  estoqueMaximo?: number;
  estoqueAtual?: number;
}
