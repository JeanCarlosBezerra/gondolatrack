// === INÍCIO ARQUIVO: src/abastecimentos/dto/gerar-abastecimento.dto.ts ===
import { IsInt, IsOptional, IsPositive, Min } from "class-validator";

export class GerarAbastecimentoDto {
  @IsInt()
  @IsPositive()
  idLoja!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  diasVenda?: number; // default 30

  @IsOptional()
  @IsInt()
  @Min(1)
  coberturaDias?: number; // default 7

  // opcional: se quiser travar em um período específico depois a gente adiciona dtIni/dtFim
}
// === FIM ARQUIVO ===
