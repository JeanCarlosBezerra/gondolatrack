// ✅ src/lojas/loja-local-estoque.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Loja } from './loja.entity';

@Entity({ name: 'loja_locais_estoque', schema: 'gondolatrack' })
@Unique('uq_loja_local', ['idLoja', 'idEmpresa', 'idLocalEstoque'])
export class LojaLocalEstoque {
  @PrimaryGeneratedColumn({ name: 'id_loja_local_estoque', type: 'bigint' })
  idLojaLocalEstoque: number;

  @Column({ name: 'id_loja', type: 'bigint' })
  idLoja: number;

  @Column({ name: 'id_empresa', type: 'bigint' })
  idEmpresa: number;

  @Column({ name: 'id_local_estoque', type: 'bigint' })
  idLocalEstoque: number;

  // VENDA | DEPOSITO | CD
  @Column({ name: 'papel_na_loja', type: 'varchar', length: 20 })
  papelNaLoja: 'VENDA' | 'DEPOSITO' | 'CD';

  @ManyToOne(() => Loja, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_loja' })
  loja: Loja;

  @Column({ name: 'criado_em', type: 'timestamp', default: () => 'now()' })
  criadoEm: Date;
}
