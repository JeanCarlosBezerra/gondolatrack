// === INÍCIO: src/db2/db2.service.ts (ALTERADO) ===
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as ibmdb from 'ibm_db';

@Injectable()
export class Db2Service implements OnModuleDestroy {
  private readonly connStr: string;

  // >>> ALTERAÇÃO: pool (evita abrir/fechar conexão toda hora)
  private readonly pool = new ibmdb.Pool();

  constructor() {
    this.connStr =
      `DATABASE=${process.env.DB2_DATABASE};` +
      `HOSTNAME=${process.env.DB2_HOST};` +
      `PORT=${process.env.DB2_PORT};` +
      `UID=${process.env.DB2_USER};` +
      `PWD=${process.env.DB2_PASSWORD};` +
      `PROTOCOL=TCPIP`;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.pool.open(this.connStr, (err, conn) => {
        if (err) return reject(err);

        conn.query(sql, params, (qErr, data) => {
          // mantém close (devolve pro pool)
          conn.close(() => {});
          if (qErr) return reject(qErr);
          resolve((data ?? []) as T[]);
        });
      });
    });
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows?.[0] ?? null;
  }

  async onModuleDestroy() {
    // opcional: fechar pool quando app encerrar
    try { this.pool.close(); } catch {}
  }
}
// === FIM ===
