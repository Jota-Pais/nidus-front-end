// Vocabulário do sistema e formato das respostas da API

export type Perfil = 'pesquisador' | 'tecnico' | 'gestor'

export type CodigoEspecie = 'rato' | 'camundongo'

/** 'aaaa-mm-dd'. Na tela é sempre dd/mm/aaaa (ver 'lib/data.ts') */
export type DataISO = string

/** As 5 colunas do kanban, na ordem da tela */
export type EstadoCaixa = 'livres' | 'pre_reserva' | 'estoque' | 'reserva' | 'enviado'

interface PorSexo {
  m: number
  f: number
}

/** O casal no card do kanban e na célula da grade */
interface CasalNoCard {
  /** dupla de grupos genéticos, macho primeiro. ex: AB */
  identificacao: string
  /** 1 a 5 - a cor da bolinha */
  partoAtual: number
  partoPrevisto: DataISO | null
}

// GET /api/quadro?especie=
export interface CardDoKanban {
  idCaixa: number
  /** endereço na estante. ex: F1A */
  codigo: string
  numeroVisivel: string
  linhagem: string | null
  casal: CasalNoCard | null
}

export interface Kanban {
  colunas: { estado: EstadoCaixa; cards: CardDoKanban[] }[]
}

// GET /api/estantes e GET /api/estantes/:id/grade
export interface Estante {
  id: number
  sala: string
  fabricante: string
  modelo: string
  numeroVisivel: string
  faces: number
  linhas: number
  colunas: number
}

interface CaixaNaGrade {
  id: number
  estado: EstadoCaixa
  linhagem: string | null
  casal: CasalNoCard | null
}

export interface Posicao {
  linha: number
  coluna: number
  codigo: string
  /** null = posição vazia */
  caixa: CaixaNaGrade | null
}

export type Face = 'frontal' | 'traseira'

export interface Grade {
  faces: { face: Face; posicoes: Posicao[] }[]
}

// GET /api/caixas/:id
export interface Parto {
  id: number
  /** 1º a 5º */
  ordem: number
  dtAcasalamento: DataISO
  dtPartoPrevisto: DataISO | null
  dtPartoReal: DataISO | null
  nascidoM: number | null
  nascidoF: number | null
  dtSelecao: DataISO | null
  eutanasiadoM: number | null
  eutanasiadoF: number | null
  dtDesmamePrevisto: DataISO | null
  dtDesmameReal: DataISO | null
  desmamadoM: number | null
  desmamadoF: number | null
  disponivel: PorSexo
  comprometido: PorSexo
}

export interface Casal {
  id: number
  identificacao: string
  grupoMacho: string
  grupoFemea: string
  linhagem: string
  dtFormacao: DataISO
  ativo: boolean
  dtEncerramento: DataISO | null
}

export interface Ficha {
  caixa: {
    id: number
    endereco: {
      numeroVisivel: string
      sala: string
      codigo: string
    }
    especie: CodigoEspecie
    linhagem: string | null
    estado: EstadoCaixa
  }
  casal: Casal | null
  /** do 1º ao último registrado - no máximo 5 */
  partos: Parto[]
  eventos: { dataHora: string; tipo: string; descricao: string; autor: string }[]
}

// GET /api/catalogo
export interface Catalogo {
  especies: {
    id: number
    codigo: CodigoEspecie
    nome: string
    linhagens: { id: number; nome: string; ativa: boolean }[]
  }[]
  paresGeneticos: { grupoMacho: string; grupoFemea: string }[]
}

// GET /api/projetos
export interface Projeto {
  id: number
  /** formato 23080.XXXXXX/AAAA-XX */
  numero: string
  vigente: boolean
}

export type Cronograma = 'unica' | 'semanal' | 'quinzenal' | 'mensal'

export type StatusSolicitacao =
  | 'rascunho'
  | 'enviada'
  | 'em_analise'
  | 'aprovada'
  | 'recusada'
  | 'ajustada'
  | 'em_atendimento'
  | 'concluida'
  | 'cancelada'

// GET /api/solicitacoes
export interface Solicitacao {
  id: number
  projeto: string
  solicitante: string
  especie: CodigoEspecie
  idLinhagem: number
  linhagem: string
  machos: number
  femeas: number
  /** dias desde o nascimento */
  idade: number
  dataEntrega: DataISO
  cronograma: Cronograma
  status: StatusSolicitacao
}

/** de onde vem o animal: já desmamado, já nascido, ou parto ainda previsto */
export type Origem = 'de_fato' | 'previsao' | 'previsao_parto'

// GET /api/busca
export interface CaixaCandidata {
  idCaixa: number
  idParto: number
  codigo: string
  numeroVisivel: string
  estado: EstadoCaixa
  casal: string
  /** 1º a 5º */
  parto: number
  origem: Origem
  nascimento: DataISO
  idadeNaEntrega: number
  disponivel: PorSexo
  /** quanto o motor sugere tirar desta caixa */
  alocar: PorSexo
  sugerida: boolean
}

export interface ResultadoDaBusca {
  faixa: { min: number; max: number }
  candidatas: CaixaCandidata[]
  deficit: PorSexo
  casaisAFormar: number
  acasalamentoNovo: { dataMinimaDeEntrega: DataISO; viavel: boolean }
}
