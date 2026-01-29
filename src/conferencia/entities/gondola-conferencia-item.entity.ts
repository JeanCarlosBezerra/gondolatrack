import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GondolaConferencia } from './gondola-conferencia.entity';

@Entity({ schema: 'gondolatrack', name: 'gondola_conferencia_item' })
export class GondolaConferenciaItem {
  @PrimaryGeneratedColumn({ name: 'id_item', type: 'bigint' })
  idItem: string; // bigint costuma virar string no TS

  @Column({ name: 'id_conferencia', type: 'bigint' })
  idConferencia: string;

  @ManyToOne(() => GondolaConferencia, (c) => c.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_conferencia' })
  conferencia: GondolaConferencia;

  @Column({ name: 'id_produto', type: 'bigint', nullable: true })
  idProduto?: string | null;

  @Column({ name: 'ean', type: 'varchar', length: 32, nullable: true })
  ean?: string | null;

  @Column({ name: 'descricao', type: 'varchar', length: 255, nullable: true })
  descricao?: string | null;

  @Column({ name: 'qtd_conferida', type: 'numeric', precision: 14, scale: 3, default: 0 })
  qtdConferida: string; // ok manter string

  @Column({
    name: 'estoque_loja_snapshot',
    type: 'numeric',
    precision: 14,
    scale: 3,
    default: 0,
    nullable: true,
  })
  estoqueLojaSnapshot?: string | null;

// exemplo (ajuste o tipo conforme seu padrão: numeric/text)
@Column({ name: 'estoque_venda', type: 'numeric', nullable: true })
estoqueVenda?: string | null;

@Column({ name: 'estoque_deposito', type: 'numeric', nullable: true })
estoqueDeposito?: string | null;

@Column({ name: 'estoque_loja_total', type: 'numeric', nullable: true })
estoqueLojaTotal?: string | null;
}
