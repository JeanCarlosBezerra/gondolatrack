import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosTenantService {
  constructor(@InjectRepository(Usuario) private repo: Repository<Usuario>) {}

  async getTenantOrThrow(username: string) {
    const u = await this.repo.findOne({ where: { username } });
    if (!u || !u.ativo) {
      throw new UnauthorizedException(
        'Usuário não cadastrado no GondolaTrack ou inativo. Cadastre o username e id_empresa na tabela gondolatrack.usuarios.',
      );
    }
    return { idEmpresa: Number(u.idEmpresa), nome: u.nome ?? null };
  }

  async touchName(username: string, nome: string | null) {
    await this.repo
      .update({ username }, { nome: nome ?? null, atualizadoEm: new Date() as any })
      .catch(() => {});
  }

  // === INÍCIO ALTERAÇÃO: auto-provision ===
  async ensureTenantFromAd(params: {
    username: string;
    nome: string | null;
    idEmpresaDefault: number;      // ex: 1 (DICASA)
    allowed: boolean;              // true se passou na regra (grupo AD)
  }) {
    const { username, nome, idEmpresaDefault, allowed } = params;

    const existing = await this.repo.findOne({ where: { username } });
    if (existing) {
      // atualiza nome e garante ativo (se quiser)
      await this.repo.update(
        { username },
        { nome: nome ?? null, atualizadoEm: new Date() as any },
      ).catch(() => {});
      return {
        idEmpresa: Number(existing.idEmpresa),
        nome: existing.nome ?? null,
      };
    }

    if (!allowed) {
      throw new UnauthorizedException(
        'Usuário não autorizado: não está no grupo permitido do AD para auto-cadastro.',
      );
    }

    const created = this.repo.create({
      username,
      nome: nome ?? null,
      idEmpresa: idEmpresaDefault as any,
      ativo: true as any,
    });

    const saved = await this.repo.save(created);

    return {
      idEmpresa: Number(saved.idEmpresa),
      nome: saved.nome ?? null,
    };
  }

  async getOrCreateLdapDefault(username: string, nome: string | null, idEmpresaDefault: number) {
  let u = await this.repo.findOne({ where: { username } });

  if (!u) {
    u = this.repo.create({
      username,
      nome: nome ?? null,
      idEmpresa: idEmpresaDefault as any,
      ativo: true,
    });
    await this.repo.save(u);
  }

  if (!u.ativo) {
    throw new UnauthorizedException('Usuário inativo no GondolaTrack.');
  }

  return { idEmpresa: Number(u.idEmpresa), nome: u.nome ?? null };
}
  // === FIM ALTERAÇÃO ===
}
