/**
 * Anexo A do documento de requisitos — dados de carga inicial.
 *
 * São valores **concretos, fornecidos pelo cliente**. Não são regra de código:
 * entram por carga inicial e podem mudar sem alteração de software (`RNF-05`).
 * Estão aqui para desenvolver tela antes da API existir; quando a API existir,
 * saem daqui e vêm de `catalogo.*` no banco.
 */
import type { CodigoEspecie, GrupoGenetico } from '@/dominio/tipos'

export interface Especie {
  codigo: CodigoEspecie
  nome: string
  nomeCientifico: string
  linhagens: string[]
}

/** Anexo A.1. Cada espécie tem duas colônias em paralelo: Piloto e Produção. */
export const ESPECIES: Especie[] = [
  {
    codigo: 'rato',
    nome: 'Rato',
    nomeCientifico: 'Rattus norvegicus',
    linhagens: ['Wistar', 'SHR', 'Kyoto'],
  },
  {
    codigo: 'camundongo',
    nome: 'Camundongo',
    nomeCientifico: 'Mus musculus',
    linhagens: ['Swiss', 'C57BL/6J'],
  },
]

/** `PEN-04` em aberto: é rótulo ou tem regra? Afeta elegibilidade no motor. */
export const COLONIAS = ['Piloto', 'Produção'] as const

/** Infraestrutura atual: 3 salas de criação independentes. */
export const SALAS = [1, 2, 3] as const

/** Anexo A.3 — grupos genéticos do cruzamento rotacional. */
export const GRUPOS_GENETICOS: GrupoGenetico[] = ['A', 'B', 'C', 'D', 'E']

/**
 * `RN-02` — pares permitidos, rotação em anel para evitar consanguinidade.
 * O primeiro caractere é o grupo do macho: `AB` = macho A + fêmea B.
 *
 * **Lista configurável, não fixa no código** (`RNF-05`) — está aqui como carga
 * inicial. A validação que recusa casal fora da lista é do servidor.
 */
export const PARES_GENETICOS_VALIDOS = ['AB', 'BC', 'CD', 'DE', 'EA'] as const

/**
 * Anexo A.4 — máscara do número de projeto de ética, para `RF-DEM-06`.
 *
 * ⚠️ Confirmar com o cliente se o prefixo `23080` é fixo (código da
 * instituição) ou se o sistema precisa aceitar outros: pesquisador com projeto
 * de instituição parceira é caso plausível.
 */
export const MASCARA_PROJETO_ETICA = '23080.XXXXXX/AAAA-XX'
export const REGEX_PROJETO_ETICA = /^23080\.\d{6}\/\d{4}-\d{2}$/

/**
 * `RN-01` — parâmetros do ciclo biológico homologados pelo corpo técnico.
 *
 * ⚠️ **Não são constantes de código.** São parâmetros por espécie, editáveis
 * pelo gestor, com histórico: cálculo feito no passado precisa continuar
 * reproduzível. Estão aqui como carga inicial e como rótulo de tela — o cálculo
 * é do servidor (`RNF-01`).
 */
export const PARAMETROS_BIOLOGICOS = {
  gestacaoDias: 23,
  aleitamentoDias: 22,
  intervaloEntreCiclosDias: 6,
  maxPartosPorCasal: 5,
  /** ⚠️ `PEN-05` e `CONF-03`: a spec também diz que não há limite de filhotes. */
  expectativaMachosPorParto: 4,
  expectativaFemeasPorParto: 4,
} as const

/**
 * `RN-07` — tolerância de idade. Pedido de idade X aceita X ± variação, e a
 * variação cresce com a idade. **Tabela é dado configurável, não código.**
 */
export interface FaixaTolerancia {
  minimo: number
  /** `null` = sem limite superior (a faixa "> 90"). */
  maximo: number | null
  variacao: number
}

export const TOLERANCIA_IDADE: FaixaTolerancia[] = [
  { minimo: 21, maximo: 22, variacao: 1 },
  { minimo: 23, maximo: 25, variacao: 2 },
  { minimo: 26, maximo: 30, variacao: 3 },
  { minimo: 31, maximo: 40, variacao: 4 },
  { minimo: 41, maximo: 50, variacao: 5 },
  { minimo: 51, maximo: 60, variacao: 7 },
  { minimo: 61, maximo: 90, variacao: 10 },
  { minimo: 91, maximo: null, variacao: 15 },
]
