// === INÍCIO ARQUIVO NOVO: src/abastecimentos/dto/atualizar-itens.dto.ts ===
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class AtualizarItemPayload {
  @IsString()
  @IsNotEmpty()
  idAbastecimentoItem!: string;

  // vamos receber como string (ex: "8.400") para evitar float bug
  @IsString()
  @IsNotEmpty()
  qtdSelecionada!: string;
}

export class AtualizarItensDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarItemPayload)
  itens!: AtualizarItemPayload[];
}
// === FIM ARQUIVO NOVO ===
