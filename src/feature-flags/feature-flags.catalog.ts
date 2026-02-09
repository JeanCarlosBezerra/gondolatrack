// === INÍCIO ARQUIVO NOVO: src/feature-flags/feature-flags.catalog.ts ===

export type FeatureCatalogItem = {
  key: string;
  label: string;
  description?: string;
  group: string;
};

export const FEATURE_CATALOG: FeatureCatalogItem[] = [
  // ===== CONFIGURAÇÕES =====
  {
    group: 'Configurações',
    key: 'MOD_CONFIGURACOES',
    label: 'Configurações',
    description: 'Acessar a tela de configurações.',
  },
  {
    group: 'Configurações',
    key: 'CFG_LOCAIS_ESTOQUE_VIEW',
    label: 'Locais de Estoque (visualizar)',
    description: 'Permite ver a aba de locais de estoque.',
  },
  {
    group: 'Configurações',
    key: 'CFG_LOCAIS_ESTOQUE_EDIT',
    label: 'Locais de Estoque (editar)',
    description: 'Permite adicionar/remover locais de estoque.',
  },
  {
    group: 'Configurações',
    key: 'CFG_USERS_VIEW',
    label: 'Usuários (visualizar)',
    description: 'Permite ver a aba de usuários e permissões.',
  },
  {
    group: 'Configurações',
    key: 'CFG_USERS_EDIT',
    label: 'Usuários (editar)',
    description: 'Permite editar roles e ativar/desativar usuários.',
  },

  // ===== MÓDULOS =====
  { group: 'Módulos', key: 'MOD_LOJAS', label: 'Lojas' },
  { group: 'Módulos', key: 'MOD_GONDOLAS', label: 'Gôndolas' },
  { group: 'Módulos', key: 'MOD_PRODUTOS', label: 'Produtos' },
  { group: 'Módulos', key: 'MOD_PRODUTOS_GONDOLA', label: 'Produtos na Gôndola' },
  { group: 'Módulos', key: 'MOD_CATALOGO_PRODUTOS', label: 'Catálogo de Produtos' },
  { group: 'Módulos', key: 'MOD_ABASTECIMENTO', label: 'Abastecimento' },
  { group: 'Módulos', key: 'MOD_CONFERENCIAS', label: 'Conferências' },
  { group: 'Módulos', key: 'MOD_RELATORIOS', label: 'Relatórios' },

  // ===== AÇÕES =====
  { group: 'Ações', key: 'MOD_INSERIR_LOJA', label: 'Inserir Loja' },
];

// === FIM ARQUIVO ===
