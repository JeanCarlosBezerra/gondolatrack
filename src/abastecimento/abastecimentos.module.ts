// === INÍCIO ARQUIVO: src/abastecimentos/abastecimentos.module.ts ===
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbastecimentosController } from "./abastecimento.controller";
import { AbastecimentosService } from "./abastecimentos.service";
import { Abastecimento } from "./entities/abastecimento.entity";
import { AbastecimentoItem } from "./entities/abastecimento-item.entity";
import { Db2Module } from "../db2/db2.module";

@Module({
  imports: [
    // === ALTERADO: entidades do Postgres usadas pelo abastecimento ===
    TypeOrmModule.forFeature([Abastecimento, AbastecimentoItem]),
    Db2Module,
  ],
  controllers: [AbastecimentosController],
  providers: [AbastecimentosService],
})
export class AbastecimentosModule {}
// === FIM ARQUIVO ===
