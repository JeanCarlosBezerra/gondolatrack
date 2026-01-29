import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaFeatureFlag } from './empresa-feature-flag.entity';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(EmpresaFeatureFlag)
    private repo: Repository<EmpresaFeatureFlag>,
  ) {}

  async isEnabled(idEmpresa: number, featureKey: string): Promise<boolean> {
    const row = await this.repo.findOne({
      where: { idEmpresa, featureKey },
    });
    return row ? !!row.enabled : true;
  }

  async listByEmpresa(idEmpresa: number) {
    return this.repo.find({
      where: { idEmpresa },
      order: { featureKey: 'ASC' as any },
    });
  }

  async setFlag(idEmpresa: number, featureKey: string, enabled: boolean) {
    const existing = await this.repo.findOne({ where: { idEmpresa, featureKey } });

    if (existing) {
      existing.enabled = enabled;
      return this.repo.save(existing);
    }

    const created = this.repo.create({
      idEmpresa,
      featureKey,
      enabled,
    });

    return this.repo.save(created);
  }
}
