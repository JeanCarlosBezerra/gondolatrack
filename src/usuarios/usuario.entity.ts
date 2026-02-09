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

  // ✅ ADICIONADO (tua tabela tem)
  @Column({ name: 'auth_provider', type: 'varchar', length: 40, nullable: true })
  authProvider?: string | null;

  // ✅ ADICIONADO (tua tabela tem)
  @Column({ name: 'roles', type: 'varchar', length: 500, nullable: true })
  roles?: string | null;

  @Column({ name: 'criado_em', type: 'timestamptz', default: () => 'now()' })
  criadoEm: Date;

  @Column({ name: 'atualizado_em', type: 'timestamptz', nullable: true })
  atualizadoEm?: Date | null;
}
