// === INÍCIO ARQUIVO: src/usuarios/usuarios.module.ts ===
import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { Db2Module } from '../db2/db2.module';

@Module({
  imports: [Db2Module],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
// === FIM ARQUIVO ===
