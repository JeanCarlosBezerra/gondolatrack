// === INÍCIO ARQUIVO AJUSTADO: src/usuarios/usuarios.service.ts ===
import { Injectable } from '@nestjs/common';
import { Db2Service } from '../db2/db2.service';

export type UsuarioDb2 = {
  idUsuario: number;
  nomeUsuario: string;
};

@Injectable()
export class UsuariosService {
  constructor(private readonly db2: Db2Service) {}

  async list(): Promise<UsuarioDb2[]> {
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
}
// === FIM ARQUIVO AJUSTADO ===
