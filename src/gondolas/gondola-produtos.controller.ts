// === INÍCIO ARQUIVO: src/gondolas/gondola-produtos.controller.ts ===
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'; 
//                                    ^^^^^^ ALTERAÇÃO: import Delete
import { GondolaProdutosService } from './gondola-produtos.service';
import { AddProdutoGondolaDto } from './dto/add-produto-gondola.dto';

@Controller('gondolas')
export class GondolaProdutosController {
  constructor(private readonly service: GondolaProdutosService) {}

  @Get(':idGondola/produtos')
  async list(@Param('idGondola') idGondola: string) {
    return this.service.listByGondola(Number(idGondola));
  }

  @Post(':idGondola/produtos')
  async add(@Param('idGondola') idGondola: string, @Body() dto: AddProdutoGondolaDto) {
    return this.service.addByBip(Number(idGondola), dto);
  }

  @Post(':idGondola/produtos/refresh-estoque')
    async refreshEstoque(@Param('idGondola') idGondola: string) {
      return this.service.refreshEstoqueGondola(Number(idGondola));
    }

  @Get(':idGondola/reposicao')
    async reposicao(@Param('idGondola') idGondola: string) {
      return this.service.getReposicaoGondola(Number(idGondola));
  }

  // === INÍCIO ALTERAÇÃO: delete ===
  @Delete(':idGondola/produtos/:idGondolaProduto')
  async remove(
    @Param('idGondola') idGondola: string,
    @Param('idGondolaProduto') idGondolaProduto: string,
  ) {
    return this.service.remove(Number(idGondola), Number(idGondolaProduto));
  }
  // === FIM ALTERAÇÃO: delete ===
}
// === FIM ARQUIVO ===
