// === INÍCIO: src/db2/db2.service.ts ===
import { Injectable } from '@nestjs/common';
import * as ibmdb from 'ibm_db';

@Injectable()
export class Db2Service {
  private readonly connStr: string;

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
      ibmdb.open(this.connStr, (err, conn) => {
        if (err) return reject(err);

        conn.query(sql, params, (qErr, data) => {
          conn.close(() => {});
          if (qErr) return reject(qErr);
          resolve((data ?? []) as T[]);
        });
      });
    });
  }

    async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const rows = await this.query(sql, params);
      return rows?.[0] ?? null;
    }

}
// === FIM ===
