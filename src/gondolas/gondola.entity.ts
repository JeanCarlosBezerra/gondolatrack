// === INÍCIO ARQUIVO: src/gondolas/gondola.entity.ts ===
import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Loja } from '../lojas/loja.entity';
import { OneToMany } from 'typeorm';
import { PosicaoGondola } from './posicao-gondola.entity';

@Entity({
  name: 'gondolas',          // tabela gondolas (minúsculo)
  schema: 'gondolatrack',
})
export class Gondola {
  @PrimaryGeneratedColumn({
    name: 'id_gondola',
    type: 'bigint',
  })
  idGondola: number;

  @Column({
    name: 'id_loja',
    type: 'bigint',
  })
  idLoja: number;

  @ManyToOne(() => Loja)
  @JoinColumn({ name: 'id_loja' })
  loja: Loja;

  @Column({
    name: 'nome',
    type: 'varchar',
    length: 150,
  })
  nome: string;

  @Column({
    name: 'secao_corredor',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  corredorSecao: string | null;

  @Column({
    name: 'marca',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  marca: string | null;

  @Column({
    name: 'total_posicoes',
    type: 'integer',
    default: 20,
  })
  totalPosicoes: number;

  @Column({
    name: 'criado_em',
    type: 'timestamp',
    default: () => 'now()',
  })
  criadoEm: Date;

  @Column({
    name: 'atualizado_em',
    type: 'timestamp',
    nullable: true,
  })
  atualizadoEm: Date | null;

  @Column({
  name: 'id_vendedor_responsavel',
  type: 'bigint',
  nullable: true,
  })
  idResponsavel: number | null;

  @OneToMany(() => PosicaoGondola, (p) => p.gondola, {
    cascade: true,
  })
  posicoes: PosicaoGondola[];

  @Column({ name: 'flag_conferida', type: 'boolean', default: false })
  flagConferida: boolean;

  @Column({ name: 'ultima_conferencia_id', type: 'bigint', nullable: true })
  ultimaConferenciaId: number | null;

  @Column({ name: 'ultima_conferencia_em', type: 'timestamptz', nullable: true })
  ultimaConferenciaEm: Date | null;

  @Column({ name: 'ultima_conferencia_usuario', type: 'varchar', length: 120, nullable: true })
  ultimaConferenciaUsuario: string | null;

  
}
// === FIM ARQUIVO ===
