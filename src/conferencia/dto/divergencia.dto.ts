// === INÍCIO ARQUIVO: src/conferencia/dto/divergencia.dto.ts ===
export class DivergenciaItemDto {
  idProduto!: number;
  descricao!: string | null;
  ean!: string | null;

  qtdContada!: number;     // qtd_conferida
  estoqueLoja!: number;    // sistema (loja)
  divergLoja!: number;     // contada - loja

  estoqueCd!: number;      // sistema (CD)
  divergCd!: number;       // contada - CD

  estoqueTotal!: number;   // loja + CD
  divergTotal!: number;    // contada - (loja+CD)
}

export class DivergenciasResponseDto {
  ok!: boolean;
  idGondola!: number;
  idConferencia!: number;

  resumo!: {
    itens: number;
    divergentesLoja: number;
    divergentesTotal: number;
    somaDivergLoja: number;
  };

  data!: DivergenciaItemDto[];
}
// === FIM ARQUIVO ===
