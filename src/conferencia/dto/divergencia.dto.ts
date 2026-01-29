// === INÍCIO ALTERAÇÃO: src/conferencia/dto/divergencia.dto.ts ===
export class DivergenciaItemDto {
  idProduto!: number;
  descricao!: string | null;
  ean!: string | null;

  qtdContada!: number;           // qtd_conferida

  // === NOVO: QUEBRA DA LOJA ===
  estoqueVenda!: number;         // locais VENDA
  estoqueDeposito!: number;      // locais DEPOSITO
  estoqueLojaTotal!: number;     // VENDA + DEPOSITO

  divergLoja!: number;           // qtdContada - estoqueLojaTotal

  // === OPCIONAL (se você ainda usa CD no mesmo relatório) ===
  // estoqueCd?: number;
  // divergCd?: number;
}

export class DivergenciasResponseDto {
  ok!: boolean;
  idGondola!: number;
  idConferencia!: number;

  resumo!: {
    itens: number;
    divergentesLoja: number;
    somaDivergLoja: number;
  };

  // mantenha "data" se seu backend já responde assim,
  // mas o front hoje está lendo "itens".
  data!: DivergenciaItemDto[];
}
// === FIM ALTERAÇÃO ===
