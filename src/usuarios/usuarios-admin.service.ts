import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import { UpdateUsuarioAdminDto } from './dto/update-usuario-admin.dto';

@Injectable()
export class UsuariosAdminService {
  constructor(@InjectRepository(Usuario) private repo: Repository<Usuario>) {}

  async listByEmpresa(idEmpresa: number) {
    return this.repo.find({
      where: { idEmpresa: String(idEmpresa) as any },
      order: { username: 'ASC' as any },
    });
  }

  async update(idEmpresa: number, idUsuario: number, dto: UpdateUsuarioAdminDto) {
    const u = await this.repo.findOne({
      where: { idUsuario: String(idUsuario) as any, idEmpresa: String(idEmpresa) as any },
    });

    if (!u) throw new NotFoundException('Usuário não encontrado');

    if (dto.nome !== undefined) u.nome = dto.nome;
    if (dto.ativo !== undefined) u.ativo = dto.ativo;
    if (dto.roles !== undefined) (u as any).roles = dto.roles; // coluna já existe no seu banco

    (u as any).atualizadoEm = new Date() as any;
    return this.repo.save(u);
  }
}
