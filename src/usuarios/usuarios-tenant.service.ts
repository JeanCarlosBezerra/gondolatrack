import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosTenantService {
  constructor(@InjectRepository(Usuario) private repo: Repository<Usuario>) {}

  // src/usuarios/usuarios-tenant.service.ts

async getTenantOrThrow(username: string) {
  const u = await this.repo.findOne({ where: { username } });

  if (!u || !u.ativo) {
    throw new UnauthorizedException(
      'Usuário não cadastrado no GondolaTrack ou inativo. Cadastre o username e id_empresa na tabela gondolatrack.usuarios.',
    );
  }

  return {
    idEmpresa: Number(u.idEmpresa),
    nome: u.nome ?? null,
    roles: u.roles ?? '', // ✅ sempre string
  };
}

async ensureTenantFromAd(params: {
  username: string;
  nome: string | null;
  idEmpresaDefault: number;
  allowed: boolean;
}) {
  const { username, nome, idEmpresaDefault, allowed } = params;

  const existing = await this.repo.findOne({ where: { username } });
  if (existing) {
    await this.repo.update(
      { username },
      { nome: nome ?? null, atualizadoEm: new Date() as any },
    ).catch(() => {});

    return {
      idEmpresa: Number(existing.idEmpresa),
      nome: existing.nome ?? null,
      roles: existing.roles ?? '', // ✅ sempre string
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
    roles: '', // ✅ default
  });

  const saved = await this.repo.save(created);

  return {
    idEmpresa: Number(saved.idEmpresa),
    nome: saved.nome ?? null,
    roles: saved.roles ?? '', // ✅ sempre string
  };
}


  async touchName(username: string, nome: string | null) {
    await this.repo
      .update({ username }, { nome: nome ?? null, atualizadoEm: new Date() as any })
      .catch(() => {});
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
