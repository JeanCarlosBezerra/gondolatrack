// === INÍCIO ARQUIVO AJUSTADO: src/gondolas/posicao-gondola.entity.ts ===
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gondola } from './gondola.entity';


@Entity({ name: 'posicoes_gondola', schema: 'gondolatrack' })
export class PosicaoGondola {
  @PrimaryGeneratedColumn({ name: 'id_posicao' })
  idPosicao: number;

  @Column({ name: 'id_gondola', type: 'bigint' })
  idGondola: number;

  @Column({ name: 'id_produto', type: 'bigint' })
  idProduto: number;

  @Column({ name: 'posicao', type: 'integer' })
  posicao: number;

  @Column({ name: 'estoque_maximo', type: 'integer', nullable: true })
  estoqueMaximo: number | null;

  @Column({ name: 'estoque_atual', type: 'integer', nullable: true })
  estoqueAtual: number | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp', nullable: true })
  atualizadoEm: Date | null;

  // relação com Gôndola (opcional, mas útil)
  @ManyToOne(() => Gondola, (g) => g.posicoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_gondola' })
  gondola: Gondola;
}
// === FIM ARQUIVO AJUSTADO ===
