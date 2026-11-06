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
  encerrado: boolean
  /**
   * só as ninhadas que já nasceram: o que existe de cada uma e a idade de hoje. Inclui as que um
   * casal encerrado deixou na caixa
   */
  ninhadas: NinhadaNoCard[]
}

export interface NinhadaNoCard {
  /** o casal que teve a ninhada: o da caixa, ou um que veio antes dele */
  casal: string
  parto: number
  m: number
  f: number
  idadeDias: number
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
  /** reservado para uma solicitação e ainda na caixa */
  comprometido: PorSexo
  /** já saiu da caixa: a entrega da solicitação foi registrada */
  entregue: PorSexo
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
  /** casais de antes que deixaram ninhada na caixa, com os partos que nasceram */
  anteriores: { casal: Casal; partos: Parto[] }[]
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

export type SituacaoDoProjeto = 'vigente' | 'vencido' | 'suspenso'

// GET /api/projetos
export interface Projeto {
  id: number
  /** o processo 23080.XXXXXX/AAAA-XX ou os 10 dígitos do Sistema CEUA (@/dominio/protocolo) */
  numero: string
  vigente: boolean
  titulo: string
  idUsuarioResponsavel: number
  responsavel: string
  dtVigenciaInicio: DataISO
  dtVigenciaFim: DataISO
  cotaAutorizada: number
  situacao: SituacaoDoProjeto
}

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
  dataSolicitacao: DataISO
  prazoResposta: DataISO | null
  dataAceite: DataISO | null
  dataRecusa: DataISO | null
  /** o processo 23080.XXXXXX/AAAA-XX ou os 10 dígitos do Sistema CEUA (@/dominio/protocolo) */
  protocoloCeua: string
  /** o nome que a pessoa digitou no pedido */
  pesquisador: string
  /** o e-mail da conta que fez o pedido */
  email: string
  especie: CodigoEspecie
  idLinhagem: number
  linhagem: string
  machos: number
  femeas: number
  /** animais de qualquer sexo */
  qualquer: number
  /** a faixa de idade na entrega, em dias desde o nascimento; iguais quando a idade é exata */
  idadeMin: number
  idadeMax: number
  dataEntrega: DataISO
  observacoes: string | null
  status: StatusSolicitacao
  motivoRecusa: string | null
}

/** de onde vem o animal: já desmamado, já nascido, ou parto ainda previsto */
export type Origem = 'de_fato' | 'previsao'

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
  /** o que o plantel não cobre; o "qualquer" sobra quando nem a sobra das caixas o cobre */
  deficit: PorSexo & { qualquer: number }
  casaisAFormar: number
  acasalamentoNovo: { dataMinimaDeEntrega: DataISO; viavel: boolean }
}

// GET /api/estoque?especie=
export interface EstoqueDaLinhagem {
  idLinhagem: number
  linhagem: string
  confirmado: PorSexo
  previsto: PorSexo
  total: PorSexo
}

export interface Estoque {
  especie: CodigoEspecie
  linhagens: EstoqueDaLinhagem[]
}

// POST /api/solicitacoes/viabilidade: só se o CPMR consegue atender, sem números da colônia
export interface Viabilidade {
  viavel: boolean
  /** por que não dá, escrito para quem pede; nulo quando dá */
  motivo: string | null
}

// GET /api/usuarios
export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  temSenha: boolean
}

// GET /api/historico
export interface RegistroDoHistorico {
  id: number
  dataHora: string
  usuario: string
  entidade: string
  idEntidade: number
  acao: string
  descricao: string
  dados: unknown
}
