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


  @Column({ name: 'criado_em', type: 'timestamp', default: () => 'now()' })
  criadoEm: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', nullable: true })
  atualizadoEm: Date | null;

  @Column({ name: 'id_empresa_tenant', type: 'bigint', nullable: true })
  idEmpresaTenant: number | null;
  
  // ERP/DB2
  @Column({ name: 'id_empresa_erp', type: 'bigint', nullable: true })
  idEmpresaErp: number | null;
}
// === FIM ARQUIVO AJUSTADO ===
