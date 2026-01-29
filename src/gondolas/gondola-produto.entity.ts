// === INÍCIO ARQUIVO: src/gondolas/gondola-produto.entity.ts ===
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Gondola } from './gondola.entity';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value == null ? 0 : Number(value)),
};

@Entity({ name: 'gondola_produtos', schema: 'gondolatrack' })
@Unique('UQ_LOJA_PRODUTO', ['idLoja', 'idProduto'])
@Unique('UQ_GONDOLA_PRODUTO', ['idGondola', 'idProduto'])
export class GondolaProduto {
  @PrimaryGeneratedColumn({ name: 'id_gondola_produto', type: 'bigint' })
  idGondolaProduto: number;

  @Column({ name: 'id_gondola', type: 'bigint' })
  idGondola: number;

  @ManyToOne(() => Gondola, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_gondola' })
  gondola: Gondola;

  @Column({ name: 'id_loja', type: 'bigint' })
  idLoja: number;

  @Column({ name: 'id_produto', type: 'bigint' })
  idProduto: number;

  // SNAPSHOT DO PRODUTO (DO DB2)
  @Column({ name: 'ean', type: 'varchar', length: 14 })
  ean: string;

  @Column({ name: 'descricao', type: 'varchar', length: 200 })
  descricao: string;

  @Column({ name: 'minimo', type: 'int' })
  minimo: number;

  @Column({ name: 'maximo', type: 'int' })
  maximo: number;

@Column({
  name: 'estoque_atual',
  type: 'numeric',
  precision: 14,
  scale: 3,
  default: 0,
  transformer: numericTransformer,
})
estoqueAtual: number;

@Column({
  name: 'estoque_venda',
  type: 'numeric',
  precision: 14,
  scale: 3,
  default: 0,
  transformer: numericTransformer,
})
estoqueVenda: number;

@Column({
  name: 'estoque_deposito',
  type: 'numeric',
  precision: 14,
  scale: 3,
  default: 0,
  transformer: numericTransformer,
})
estoqueDeposito: number;

  @Column({ name: 'atualizado_em', type: 'timestamp', default: () => 'now()' })
  atualizadoEm: Date;
}
// === FIM ARQUIVO ===
