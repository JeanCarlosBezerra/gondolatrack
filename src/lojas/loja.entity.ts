// === INÍCIO ARQUIVO AJUSTADO: src/lojas/loja.entity.ts ===
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'lojas',
  schema: 'gondolatrack',
})
export class Loja {
  @PrimaryGeneratedColumn({ name: 'id_loja', type: 'bigint' })
  idLoja: number;

  @Column({ name: 'codigo_erp', type: 'varchar', length: 50, unique: true })
  codigoErp: string;

  @Column({ name: 'nome', type: 'varchar', length: 150 })
  nome: string;

  // ✅ NOVO: IDEMPRESA do DB2 (para consultar estoque)
  @Column({ name: 'id_empresa', type: 'bigint', nullable: true })
  idEmpresa: number | null;

  @Column({ name: 'criado_em', type: 'timestamp', default: () => 'now()' })
  criadoEm: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', nullable: true })
  atualizadoEm: Date | null;
}
// === FIM ARQUIVO AJUSTADO ===
