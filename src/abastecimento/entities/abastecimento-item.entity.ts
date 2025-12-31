// === INÍCIO ARQUIVO: src/abastecimentos/entities/abastecimento-item.entity.ts ===
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Abastecimento } from "./abastecimento.entity";

@Entity({ schema: "gondolatrack", name: "abastecimento_itens" })
@Index("idx_abast_item_abast", ["idAbastecimento"])
@Index("idx_abast_item_subprod", ["idsubproduto"])
export class AbastecimentoItem {
  @PrimaryGeneratedColumn({ name: "id_abastecimento_item", type: "bigint" })
  idAbastecimentoItem!: string;

  @Column({ name: "id_abastecimento", type: "bigint" })
  idAbastecimento!: string;

  @ManyToOne(() => Abastecimento, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "id_abastecimento" })
  abastecimento?: Abastecimento;

  @Column({ name: "idsubproduto", type: "bigint" })
  idsubproduto!: string;

  @Column({ name: "ean", type: "varchar", length: 20, nullable: true })
  ean!: string | null;

  @Column({ name: "descricao", type: "varchar", length: 255, nullable: true })
  descricao!: string | null;

  @Column({ name: "estoque_loja", type: "numeric", precision: 18, scale: 3, default: 0 })
  estoqueLoja!: string; // numeric -> string no JS

  @Column({ name: "estoque_cd", type: "numeric", precision: 18, scale: 3, default: 0 })
  estoqueCd!: string;

  @Column({ name: "total_vendido_periodo", type: "numeric", precision: 18, scale: 3, default: 0 })
  totalVendidoPeriodo!: string;

  @Column({ name: "media_dia", type: "numeric", precision: 18, scale: 6, default: 0 })
  mediaDia!: string;

  @Column({ name: "estoque_alvo", type: "numeric", precision: 18, scale: 3, default: 0 })
  estoqueAlvo!: string;

  @Column({ name: "qtd_sugerida", type: "numeric", precision: 18, scale: 3, default: 0 })
  qtdSugerida!: string;

  @Column({ name: "qtd_selecionada", type: "numeric", precision: 18, scale: 3, default: 0 })
  qtdSelecionada!: string;
}
// === FIM ARQUIVO ===
