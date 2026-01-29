import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'gondolatrack', name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario', type: 'bigint' })
  idUsuario: string;

  @Column({ name: 'username', type: 'varchar', length: 120, unique: true })
  username: string;

  @Column({ name: 'nome', type: 'varchar', length: 200, nullable: true })
  nome?: string | null;

  @Column({ name: 'id_empresa', type: 'bigint' })
  idEmpresa: string;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'criado_em', type: 'timestamptz', default: () => 'now()' })
  criadoEm: Date;

  @Column({ name: 'atualizado_em', type: 'timestamptz', nullable: true })
  atualizadoEm?: Date | null;
}
