import { Injectable, NotFoundException } from '@nestjs/common';
import { Db2Service } from '../db2/db2.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

export type UsuarioDb2 = {
  idUsuario: number;
  nomeUsuario: string;
};

@Injectable()
export class UsuariosService {
  constructor(
    private readonly db2: Db2Service,
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
  ) {}

  // ✅ LISTA DO ERP (DB2) - pra ajudar a escolher usuário
  async listErp(): Promise<UsuarioDb2[]> {
    const rows = await this.db2.query<any>(`
      SELECT IDUSUARIO, NOMEUSUARIO
      FROM USUARIO
      ORDER BY NOMEUSUARIO
    `);

    return (rows ?? []).map((r: any) => ({
      idUsuario: Number(r.IDUSUARIO ?? r.idusuario),
      nomeUsuario: String(r.NOMEUSUARIO ?? r.nomeusuario ?? ''),
    }));
  }

  // ✅ LISTA LOCAL (Postgres) - onde tem roles/idEmpresa/ativo
  async listLocal() {
    return this.repo.find({
      select: [
        'idUsuario',
        'username',
        'nome',
        'idEmpresa',
        'ativo',
        'authProvider',
        'roles',
        'criadoEm',
        'atualizadoEm',
      ],
      order: { nome: 'ASC' as any },
    });
  }

  async updateRoles(idUsuario: number, roles: string[]) {
    const u = await this.repo.findOne({ where: { idUsuario: String(idUsuario) as any } });
    if (!u) throw new NotFoundException('Usuário não encontrado');

    u.roles = (roles ?? []).join(',');
    u.atualizadoEm = new Date() as any;
    return this.repo.save(u);
  }
}
