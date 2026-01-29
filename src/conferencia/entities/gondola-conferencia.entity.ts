// === INÍCIO ALTERAÇÃO: src/conferencia/entities/gondola-conferencia.entity.ts ===
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

  // === [NOVO] resumo persistido ===
  @Column({ name: 'qtd_itens', type: 'int', default: 0 })
  qtdItens: number;

  @Column({ name: 'total_conferido', type: 'numeric', precision: 14, scale: 3, default: 0 })
  totalConferido: string; // mantém string igual aos itens

  @Column({ name: 'qtd_divergentes_loja', type: 'int', default: 0 })
  qtdDivergentesLoja: number;

  @Column({ name: 'soma_diverg_loja', type: 'numeric', precision: 14, scale: 3, default: 0 })
  somaDivergLoja: string; // string também

  @OneToMany(() => GondolaConferenciaItem, (i) => i.conferencia, { cascade: true })
  itens: GondolaConferenciaItem[];
}
// === FIM ALTERAÇÃO ===
