import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GondolaConferenciaItem } from './gondola-conferencia-item.entity';

@Entity({ schema: 'gondolatrack', name: 'gondola_conferencia' })
export class GondolaConferencia {
  @PrimaryGeneratedColumn({ name: 'id_conferencia' })
  idConferencia: number;

  @Column({ name: 'id_gondola', type: 'int' })
  idGondola: number;

  @Column({ name: 'criado_em', type: 'timestamptz', default: () => 'NOW()' })
  criadoEm: Date;

  @Column({ name: 'usuario', type: 'varchar', length: 120 })
  usuario: string;

  @Column({ name: 'nome', type: 'varchar', length: 200, nullable: true })
  nome?: string | null;

  @OneToMany(() => GondolaConferenciaItem, (i) => i.conferencia, { cascade: true })
  itens: GondolaConferenciaItem[];
}
