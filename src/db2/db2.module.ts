// === INÍCIO ARQUIVO AJUSTADO: src/db2/db2.module.ts ===
import { Module } from '@nestjs/common';
import { Db2Service } from './db2.service';

@Module({
  providers: [Db2Service],
  exports: [Db2Service], // ✅ obrigatório para outros módulos usarem
})
export class Db2Module {}
// === FIM ARQUIVO AJUSTADO ===
