// === INÍCIO ARQUIVO AJUSTADO: src/usuarios/usuarios.controller.ts ===
import { Controller, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
// === FIM ARQUIVO AJUSTADO ===
