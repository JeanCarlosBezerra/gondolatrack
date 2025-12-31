// === INÍCIO ARQUIVO: src/abastecimentos/entities/abastecimento.entity.ts ===
import { Loja } from "src/lojas/loja.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
//import { Loja } from "../../lojas/entities/loja.entity"; // ajuste o path conforme seu projeto

export type AbastecimentoStatus =
  | "RASCUNHO"
  | "CONFIRMADO"
  | "EXPORTADO"
  | "CONCLUIDO"
  | "CANCELADO";

@Entity({ schema: "gondolatrack", name: "abastecimentos" })
export class Abastecimento {
  @PrimaryGeneratedColumn({ name: "id_abastecimento", type: "bigint" })
  idAbastecimento!: string;

  @Column({ name: "id_loja", type: "bigint" })
  idLoja!: string;

  @ManyToOne(() => Loja, { eager: false })
  @JoinColumn({ name: "id_loja" })
  loja?: Loja;

  @Column({ name: "status", type: "varchar", length: 20, default: "RASCUNHO" })
  status!: AbastecimentoStatus;

  @Column({ name: "dt_base", type: "date", default: () => "CURRENT_DATE" })
  dtBase!: string;

  @Column({ name: "dias_venda", type: "int", default: 30 })
  diasVenda!: number;

  @Column({ name: "cobertura_dias", type: "int", default: 7 })
  coberturaDias!: number;

  @CreateDateColumn({ name: "criado_em", type: "timestamp" })
  criadoEm!: Date;

  @UpdateDateColumn({ name: "atualizado_em", type: "timestamp", nullable: true })
  atualizadoEm!: Date | null;
}
// === FIM ARQUIVO ===
