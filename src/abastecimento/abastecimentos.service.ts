// === INÍCIO ARQUIVO: src/abastecimentos/abastecimentos.service.ts ===
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Abastecimento } from "./entities/abastecimento.entity";
import { AbastecimentoItem } from "./entities/abastecimento-item.entity";
import { GerarAbastecimentoDto } from "./dto/gerar-abastecimento.dto";

// Ajuste para o seu serviço de DB2 (o seu projeto já tem um módulo/conexão)
import { Db2Service } from "../db2/db2.service"; // ajuste o path conforme seu projeto

@Injectable()
export class AbastecimentosService {
  constructor(
    @InjectRepository(Abastecimento) private abastRepo: Repository<Abastecimento>,
    @InjectRepository(AbastecimentoItem) private itemRepo: Repository<AbastecimentoItem>,
    private dataSource: DataSource,
    private db2: Db2Service,
  ) {}

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
}
// === FIM ARQUIVO ===
