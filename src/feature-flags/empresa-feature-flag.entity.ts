import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ schema: 'gondolatrack', name: 'empresa_feature_flag' })
@Unique('uq_empresa_feature', ['idEmpresa', 'featureKey'])
export class EmpresaFeatureFlag {
  @PrimaryGeneratedColumn({ name: 'id_feature', type: 'bigint' })
  idFeature: number;

  @Column({ name: 'id_empresa', type: 'bigint' })
  idEmpresa: number;

  @Column({ name: 'feature_key', type: 'varchar', length: 80 })
  featureKey: string;

  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'atualizado_em', type: 'timestamptz', default: () => 'now()' })
  atualizadoEm: Date;
}
