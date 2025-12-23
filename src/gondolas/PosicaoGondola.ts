import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Gondola } from 'src/gondolas/gondola.entity';

@Entity({ name: 'posicoes_gondola', schema: 'gondolatrack' })
export class PosicaoGondola {
  
  @PrimaryGeneratedColumn({ name: 'id_posicao', type: 'bigint' })
  idPosicao: number;

  @ManyToOne(() => Gondola, { eager: true })
  @JoinColumn({ name: 'id_gondola' })
  gondola: Gondola;

  @Column({ name: 'id_produto', type: 'bigint' })
  idProduto: number;

  @Column({ name: 'posicao', type: 'integer' })
  posicao: number;

  @Column({ name: 'estoque_maximo', type: 'integer', nullable: true })
  estoqueMaximo: number | null;

  @Column({ name: 'estoque_atual', type: 'integer', nullable: true })
  estoqueAtual: number | null;

  @Column({
    name: 'criado_em',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  criadoEm: Date;

  @Column({
    name: 'atualizado_em',
    type: 'timestamp',
    nullable: true,
  })
  atualizadoEm: Date | null;

}
