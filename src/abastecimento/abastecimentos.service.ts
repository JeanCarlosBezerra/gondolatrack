// === INÍCIO ARQUIVO: src/abastecimentos/abastecimentos.service.ts ===
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Abastecimento } from "./entities/abastecimento.entity";
import { AbastecimentoItem } from "./entities/abastecimento-item.entity";
import { GerarAbastecimentoDto } from "./dto/gerar-abastecimento.dto";
import { Buffer } from "buffer";

// Ajuste para o seu serviço de DB2 (o seu projeto já tem um módulo/conexão)
import { Db2Service } from "../db2/db2.service"; // ajuste o path conforme seu projeto
import { AtualizarItensDto } from "./dto/atualizar-itens.dto";
import ExcelJS from "exceljs";

@Injectable()
export class AbastecimentosService {
  constructor(
    @InjectRepository(Abastecimento) private abastRepo: Repository<Abastecimento>,
    @InjectRepository(AbastecimentoItem) private itemRepo: Repository<AbastecimentoItem>,
    private dataSource: DataSource,
    private db2: Db2Service,
  ) {}


  async list(idLoja?: number) {
    const where: any = {};
    if (idLoja) where.idLoja = String(idLoja);
    return this.abastRepo.find({
      where,
      order: { idAbastecimento: "DESC" as any },
      take: 50,
    });
  }

  async itens(idAbastecimento: string) {
    return this.itemRepo.find({
      where: { idAbastecimento: String(idAbastecimento) },
      order: { descricao: "ASC" as any },
    });
  }

  // [NOVO] Exporta XLSX no formato CISS: IDSUBPRODUTO / QUANTIDADE
async exportarXlsx(idAbastecimento: string): Promise<{ buffer: Buffer; filename: string }> {
  const abast = await this.abastRepo.findOne({
    where: { idAbastecimento: String(idAbastecimento) } as any,
  });
  if (!abast) throw new NotFoundException("Abastecimento não encontrado.");

  // (opcional, mas recomendado) só exporta confirmado
  if (abast.status !== "CONFIRMADO") {
    throw new BadRequestException(`Exportação permitida apenas para CONFIRMADO. Status atual: ${abast.status}`);
  }

  const itens = await this.itemRepo.find({
    where: { idAbastecimento: String(idAbastecimento) } as any,
    order: { idAbastecimentoItem: "ASC" as any },
  });

  // monta Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("CISS");

  ws.columns = [
    { header: "IDPRODUTO", key: "idproduto", width: 18 },
    { header: "QUANTIDADE", key: "quantidade", width: 14 },
  ];

  for (const it of itens) {
    // usa qtdSelecionada (não sugerida)
    const qtd = Number(it.qtdSelecionada ?? "0");
    if (!qtd || qtd <= 0) continue; // só exporta > 0

    ws.addRow({
      idproduto: String(it.idsubproduto),
      quantidade: Number(qtd.toFixed(3)),
    });
  }

  const arrayBuffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const buffer = Buffer.from(arrayBuffer);

  const safeDt = String(abast.dtBase ?? "").replaceAll("-", "");
  const filename = `abastecimento_${abast.idLoja}_${safeDt}_#${abast.idAbastecimento}.xlsx`;

  return { buffer, filename };
}


  // === NOVO: salvar qtdSelecionada (batch) ===
  async atualizarItensSelecionados(idAbastecimento: string, dto: AtualizarItensDto) {
    if (!dto?.itens?.length) {
      throw new BadRequestException("Informe ao menos 1 item para atualizar.");
    }

    const abast = await this.abastRepo.findOne({
      where: { idAbastecimento: String(idAbastecimento) },
    });
    if (!abast) throw new NotFoundException("Abastecimento não encontrado.");

    if (abast.status !== "RASCUNHO") {
      throw new BadRequestException("Só é permitido editar itens quando o status é RASCUNHO.");
    }

    // Validação forte: número decimal >= 0
    const normalize = (s: string) => {
      const v = Number(String(s).replace(",", "."));
      if (!Number.isFinite(v) || v < 0) throw new BadRequestException(`qtdSelecionada inválida: ${s}`);
      // padroniza 3 casas
      return (Math.round(v * 1000) / 1000).toFixed(3);
    };

    await this.dataSource.transaction(async (trx) => {
      for (const it of dto.itens) {
        const qtd = normalize(it.qtdSelecionada);

        // === ALTERADO: atualização direta (mais simples e segura) ===
        await trx
          .createQueryBuilder()
          .update(AbastecimentoItem)
          .set({ qtdSelecionada: qtd })
          .where("id_abastecimento_item = :id", { id: String(it.idAbastecimentoItem) })
          .andWhere("id_abastecimento = :ab", { ab: String(idAbastecimento) })
          .execute();
      }

      // marca atualizado_em no cabeçalho
      await trx
        .createQueryBuilder()
        .update(Abastecimento)
        .set({ atualizadoEm: () => "NOW()" })
        .where("id_abastecimento = :ab", { ab: String(idAbastecimento) })
        .execute();
    });

    return { ok: true };
  }

  async salvarItens(
  idAbastecimento: string,
  body: { itens: { idAbastecimentoItem: string; qtdSelecionada: string }[] },
) {
  const itens = body?.itens ?? [];
  if (!itens.length) return { ok: true };

  // valida se os itens pertencem ao abastecimento
  const ids = itens.map((i) => i.idAbastecimentoItem);

  const existentes = await this.itemRepo.find({
    where: {
      idAbastecimento: String(idAbastecimento),
    } as any,
  });

  const setExistentes = new Set(existentes.map((e) => e.idAbastecimentoItem));
  for (const id of ids) {
    if (!setExistentes.has(String(id))) {
      throw new BadRequestException(`Item ${id} não pertence ao abastecimento ${idAbastecimento}`);
    }
  }

  // atualiza um a um (simples e seguro)
  for (const it of itens) {
    await this.itemRepo.update(
      { idAbastecimentoItem: String(it.idAbastecimentoItem) } as any,
      { qtdSelecionada: String(it.qtdSelecionada ?? "0.000") } as any,
    );
  }

  return { ok: true };
}

// === ALTERADO: novo método ===
async confirmar(idAbastecimento: string) {
  const abast = await this.abastRepo.findOne({
    where: { idAbastecimento: String(idAbastecimento) } as any,
  });

  if (!abast) throw new BadRequestException("Abastecimento não encontrado.");

  // regra simples: só confirma se ainda está rascunho
  if (abast.status !== "RASCUNHO") {
    throw new BadRequestException(`Status inválido para confirmar: ${abast.status}`);
  }

  abast.status = "CONFIRMADO";
  abast.atualizadoEm = new Date().toISOString() as any; // ou deixe o banco preencher se tiver default

  await this.abastRepo.save(abast);
  return { ok: true, abastecimento: abast };
}

  // === NOVO: gerar HTML de impressão ===
  async gerarHtmlImpressao(idAbastecimento: string) {
    const abast = await this.abastRepo.findOne({
      where: { idAbastecimento: String(idAbastecimento) },
    });
    if (!abast) throw new NotFoundException("Abastecimento não encontrado.");

    const lojaRows = await this.dataSource.query(
      `SELECT id_loja, nome FROM gondolatrack.lojas WHERE id_loja = $1`,
      [Number(abast.idLoja)],
    );
    const nomeLoja = lojaRows?.[0]?.nome ?? `Loja ${abast.idLoja}`;

    const itens = await this.itemRepo.find({
      where: { idAbastecimento: String(idAbastecimento) },
      order: { descricao: "ASC" as any },
    });

    // totais
    const toNum = (s: string) => Number(String(s).replace(",", "."));
    const totalSelecionado = itens.reduce((acc, it) => acc + toNum(it.qtdSelecionada ?? "0"), 0);

    const escape = (v: any) =>
      String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    // HTML simples e eficiente (padrão A4)
    return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>Abastecimento #${escape(abast.idAbastecimento)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    h1 { margin: 0 0 8px; font-size: 20px; }
    .meta { margin-bottom: 16px; font-size: 12px; color: #333; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
    th { background: #f4f4f4; text-align: left; }
    .right { text-align: right; white-space: nowrap; }
    .muted { color: #666; font-size: 11px; margin-top: 2px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Imprimir</button>

  <h1>Abastecimento #${escape(abast.idAbastecimento)} — ${escape(abast.status)}</h1>
  <div class="meta">
    <div><b>Loja:</b> ${escape(nomeLoja)} (ID ${escape(abast.idLoja)})</div>
    <div><b>Data base:</b> ${escape(abast.dtBase)} | <b>Dias venda:</b> ${escape(abast.diasVenda)} | <b>Cobertura:</b> ${escape(abast.coberturaDias)}</div>
    <div><b>Total selecionado:</b> ${totalSelecionado.toFixed(3)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produto</th>
        <th class="right">Est. Loja</th>
        <th class="right">Est. CD</th>
        <th class="right">Vend. Período</th>
        <th class="right">Média/dia</th>
        <th class="right">Est. Alvo</th>
        <th class="right">Sugerido</th>
        <th class="right">Selecionado</th>
      </tr>
    </thead>
    <tbody>
      ${itens
        .map(
          (it) => `
        <tr>
          <td>
            <div><b>${escape(it.descricao)}</b></div>
            <div class="muted">IDSUB: ${escape(it.idsubproduto)} | EAN: ${escape(it.ean ?? "")}</div>
          </td>
          <td class="right">${escape(it.estoqueLoja)}</td>
          <td class="right">${escape(it.estoqueCd)}</td>
          <td class="right">${escape(it.totalVendidoPeriodo)}</td>
          <td class="right">${escape(it.mediaDia)}</td>
          <td class="right">${escape(it.estoqueAlvo)}</td>
          <td class="right">${escape(it.qtdSugerida)}</td>
          <td class="right"><b>${escape(it.qtdSelecionada)}</b></td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
  }

// === FIM TRECHOS NOVOS ===

  async gerar(dto: GerarAbastecimentoDto) {
    const diasVenda = dto.diasVenda ?? 30;
    const coberturaDias = dto.coberturaDias ?? 7;

    // 1) Busca loja + empresa no Postgres
    const loja = await this.dataSource.query(
      `SELECT id_loja, id_empresa, nome FROM gondolatrack.lojas WHERE id_loja = $1`,
      [dto.idLoja],
    );
    if (!loja?.length) throw new BadRequestException("Loja não encontrada.");
    const idEmpresa = Number(loja[0].id_empresa);

    // 2) Locais LOJA (VENDA/DEPOSITO)
    const locaisLoja = await this.dataSource.query(
      `SELECT id_local_estoque, id_empresa
        FROM gondolatrack.loja_locais_estoque
        WHERE id_loja = $1
        AND papel_na_loja IN ('VENDA','DEPOSITO')`,
      [dto.idLoja],
    );
    const idsLocaisLoja: number[] = locaisLoja.map((r: any) => Number(r.id_local_estoque));

    // 3) Locais CD (por EMPRESA, papel CD)  ✅ regra nova
    const IDEMPRESA_CD = 9;

    const locaisCd = await this.dataSource.query(
      `SELECT id_local_estoque
         FROM gondolatrack.loja_locais_estoque
        WHERE papel_na_loja = 'CD'
          AND id_empresa = $1`,
      [IDEMPRESA_CD],
    );
    
    const idsLocaisCd: number[] = locaisCd.map((r: any) => Number(r.id_local_estoque));

    if (idsLocaisLoja.length === 0) {
      throw new BadRequestException("Loja sem locais VENDA/DEPOSITO configurados em loja_locais_estoque.");
    }
    if (idsLocaisCd.length === 0) {
      throw new BadRequestException("Empresa sem locais CD configurados (papel_na_loja='CD') em loja_locais_estoque.");
    }

    // 4) Universo de produtos a abastecer = produtos cadastrados na gôndola da loja
    // (se quiser abastecer TODOS os produtos da empresa depois, a gente troca aqui)
    const produtos = await this.dataSource.query(
      `SELECT DISTINCT
              gp.id_produto   AS idsubproduto,
              gp.ean          AS ean,
              gp.descricao    AS descricao
         FROM gondolatrack.gondola_produtos gp
        WHERE gp.id_loja = $1
          AND gp.id_produto IS NOT NULL
          AND gp.id_produto > 0`,
      [dto.idLoja],
    );

    if (!produtos?.length) {
      throw new BadRequestException("Não há produtos cadastrados na gôndola para esta loja.");
    }

    

    // 6) Monta lista de IDs para consultar no DB2
    const subprodList: number[] = produtos
      .map((p: any) => Number(p.idsubproduto))
      .filter((v: number) => Number.isFinite(v) && v > 0);

    if (subprodList.length === 0) {
      throw new BadRequestException("Produtos da gôndola estão sem IDPRODUTO válido para abastecimento.");
    }
    // 5) Cria cabeçalho (RASCUNHO)
    const abast = this.abastRepo.create({
      idLoja: String(dto.idLoja),
      status: "RASCUNHO",
      diasVenda,
      coberturaDias,
    });
    const abastSaved = await this.abastRepo.save(abast);

    // 7) Estoque LOJA / CD no DB2 (usando DBA.PRODUTOS_SALDOS_VIEW)
    // Obs: DB2 não aceita array como Postgres; vamos montar IN (...) com segurança (somente números)
    const inSubprod = subprodList.join(",");
const inLocaisLoja = idsLocaisLoja.join(",");
const inLocaisCd = idsLocaisCd.join(",");

// === ALTERADO: CD fixo como empresa 9 ===
// === ALTERADO: usando QTDATUALESTOQUE (não QTDDISPONIVEL) ===
// Estoque loja: soma por idsubproduto nos locais VENDA/DEPOSITO
const estoqueLojaRows = await this.db2.query(`
  SELECT
    PSV.IDSUBPRODUTO,
    DECIMAL(COALESCE(SUM(PSV.QTDDISPONIVEL), 0), 18, 3) AS ESTOQUE_LOJA
  FROM DBA.PRODUTOS_SALDOS_VIEW PSV
  WHERE PSV.IDEMPRESA = ${idEmpresa}
    AND PSV.IDLOCALESTOQUE IN (${inLocaisLoja})
    AND PSV.IDSUBPRODUTO IN (${inSubprod})
  GROUP BY PSV.IDSUBPRODUTO
`);

// Estoque CD: soma por idsubproduto nos locais CD (empresa 9)
const estoqueCdRows = await this.db2.query(`
  SELECT
    PSV.IDSUBPRODUTO,
    DECIMAL(COALESCE(SUM(PSV.QTDDISPONIVEL), 0), 18, 3) AS ESTOQUE_CD
  FROM DBA.PRODUTOS_SALDOS_VIEW PSV
  WHERE PSV.IDEMPRESA = ${IDEMPRESA_CD}
    AND PSV.IDLOCALESTOQUE IN (${inLocaisCd})
    AND PSV.IDSUBPRODUTO IN (${inSubprod})
  GROUP BY PSV.IDSUBPRODUTO
`);

// 8) Vendas no período (ESTOQUE_ANALITICO) -> total vendido por IDSUBPRODUTO
// === ALTERADO: SQL real baseado no seu print ===
const vendasRows = await this.db2.query(`
  SELECT
    EA.IDSUBPRODUTO,
    DECIMAL(COALESCE(SUM(EA.QTDPRODUTO), 0), 18, 3) AS TOTAL_VENDIDO
  FROM ESTOQUE_ANALITICO EA
  JOIN NOTAS N
    ON N.IDEMPRESA = EA.IDEMPRESA
   AND N.IDPLANILHA = EA.IDPLANILHA
  JOIN NOTAS_ENTRADA_SAIDA NES
    ON NES.IDEMPRESA = N.IDEMPRESA
   AND NES.IDPLANILHA = N.IDPLANILHA
   AND NES.IDOPERACAO = EA.IDOPERACAO
   AND NES.DTMOVIMENTO = EA.DTMOVIMENTO
  JOIN OPERACAO_INTERNA OI
    ON OI.IDOPERACAO = EA.IDOPERACAO
  WHERE EA.IDEMPRESA = ${idEmpresa}
    AND EA.DTMOVIMENTO BETWEEN (CURRENT DATE - ${diasVenda} DAYS) AND CURRENT DATE
    AND N.FLAGNOTACANCEL = 'F'
    AND OI.TIPOMOVIMENTO = 'V'
    AND EA.IDSUBPRODUTO IN (${inSubprod})
  GROUP BY EA.IDSUBPRODUTO
`);

const toNum = (x: any) => Number(String(x ?? "0").replace(",", "."));

const mapEstLoja = new Map<number, number>();
for (const r of estoqueLojaRows ?? []) {
  mapEstLoja.set(Number(r.IDSUBPRODUTO), toNum(r.ESTOQUE_LOJA));
}

const mapEstCd = new Map<number, number>();
for (const r of estoqueCdRows ?? []) {
  mapEstCd.set(Number(r.IDSUBPRODUTO), toNum(r.ESTOQUE_CD));
}

const mapVendas = new Map<number, number>();
for (const r of vendasRows ?? []) {
  mapVendas.set(Number(r.IDSUBPRODUTO), toNum(r.TOTAL_VENDIDO));
}

// 10) Monta itens e calcula sugestão
// Regra:
// media_dia = total_vendido / diasVenda
// estoque_alvo = media_dia * coberturaDias
// qtd_sugerida = max(0, estoque_alvo - estoque_loja)
// opcional recomendado: limitar pelo estoque_cd
const itensToSave: Partial<AbastecimentoItem>[] = [];

for (const p of produtos) {
  const idsub = Number(p.idsubproduto);
  if (!Number.isFinite(idsub) || idsub <= 0) continue;

  const estoqueLoja = Number(mapEstLoja.get(idsub) ?? 0);
  const estoqueCd = Number(mapEstCd.get(idsub) ?? 0);
  const totalVendido = Number(mapVendas.get(idsub) ?? 0);

  const mediaDia = diasVenda > 0 ? (totalVendido / diasVenda) : 0;
  const estoqueAlvo = mediaDia * coberturaDias;

  let qtdSugerida = Math.max(0, estoqueAlvo - estoqueLoja);

  // === RECOMENDADO: não sugerir mais do que existe no CD ===
  qtdSugerida = Math.min(qtdSugerida, estoqueCd);

  // manter 3 casas decimais
  const round3 = (v: number) => Math.round(v * 1000) / 1000;
  const roundN = (v: number, casas: number) => {
  const p = Math.pow(10, casas);
    return Math.round(v * p) / p;
  };

  const toNumericString = (v: number, casas: number) => roundN(v, casas).toFixed(casas);

  itensToSave.push({
  idAbastecimento: abastSaved.idAbastecimento,
  idsubproduto: String(idsub), // bigint na entity -> string
  ean: p.ean ?? null,
  descricao: p.descricao ?? null,

  // numeric(18,3) -> string com 3 casas
  estoqueLoja: toNumericString(estoqueLoja, 3),
  estoqueCd: toNumericString(estoqueCd, 3),
  totalVendidoPeriodo: toNumericString(totalVendido, 3),

  // numeric(18,6) -> string com 6 casas
  mediaDia: toNumericString(mediaDia, 6),

  // numeric(18,3) -> string com 3 casas
  estoqueAlvo: toNumericString(estoqueAlvo, 3),
  qtdSugerida: toNumericString(qtdSugerida, 3),
  qtdSelecionada: toNumericString(qtdSugerida, 3),
});
}

// 11) Salva itens (batch)
await this.itemRepo.save(itensToSave as any);

// 12) Retorna cabeçalho + itens
const itens = await this.itemRepo.find({
  where: { idAbastecimento: abastSaved.idAbastecimento },
  order: { descricao: "ASC" as any },
});

return {
  abastecimento: abastSaved,
  itens,
};

// === FIM TRECHO AJUSTADO ===
  }

}
// === FIM ARQUIVO ===
