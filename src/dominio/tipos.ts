// Vocabulário do sistema e formato das respostas da API. Cada rato é uma linha anônima: dentro de
// uma caixa, só a idade distingue os animais, e todo número que a API manda é contado neles

export type Perfil = 'pesquisador' | 'tecnico' | 'gestor'

export type CodigoEspecie = 'rato' | 'camundongo'

/** 'aaaa-mm-dd'. Na tela é sempre dd/mm/aaaa (ver 'lib/data.ts') */
export type DataISO = string

export type Sexo = 'M' | 'F'

export interface PorSexo {
  m: number
  f: number
}

export type Face = 'frontal' | 'traseira'

/**
 * A fase da caixa, calculada do que ela tem: nada é gravado. É a cor dela na grade e na ficha. A de
 * casal fica pronta para o estoque se ainda tem desmamados; senão, mamando se tem filhotes; senão,
 * acasalada se tem parto pendente. A de estoque fica em estoque
 */
export type FaseDaCaixa = 'acasalado' | 'mamando' | 'pronto_estoque' | 'estoque'

export type TipoDeCaixa = 'casal' | 'estoque'

/** O fato que esvaziou a caixa e a liberou */
export type MotivoDaLiberacao = 'entrega' | 'baixa' | 'mudanca' | 'casal_encerrado'

/** Uma posição da estante, no corpo das rotas que criam caixa ou mudam ela de lugar */
export interface PosicaoNaEstante {
  idEstante: number
  face: Face
  linha: number
  coluna: number
}

/** Para onde vão os animais de um sexo: uma caixa de estoque que já existe ou uma posição vazia */
export type Destino = { idCaixa: number } | { posicao: PosicaoNaEstante }

/**
 * O que falta num pedido reservado que perdeu animais (baixa, correção): os sexos pedidos e os de
 * qualquer sexo. A falta é do pedido, e não trava os outros pedidos da mesma ninhada
 */
export interface FaltaDoPedido {
  idPedido: number
  m: number
  f: number
  qualquer: number
}

// ------------------------------------------------------------ grade

/** Os vivos de um parto que estão na caixa do casal, com a idade de hoje */
export interface NinhadaNoCard extends PorSexo {
  /** o casal que teve a ninhada: o da caixa, ou um que veio antes dele */
  casal: string
  parto: number
  idadeDias: number
  /** ainda não desmamou */
  mamando: boolean
}

/** O casal na célula da grade */
export interface CasalNoCard {
  /** dupla de grupos genéticos, macho primeiro. ex: AB */
  identificacao: string
  /** o parto em curso, 1 a 5 */
  partoAtual: number
  /** o número do parto na célula: acompanha a fase da caixa (ninhada que mama, desmamada ou parto pendente) */
  partoDaFase: number
  /** a previsão do parto pendente; vale também com o casal encerrado */
  partoPrevisto: DataISO | null
  encerrado: boolean
  /** casal encerrado com ninhada ainda mamando */
  aguardandoDesmame: boolean
  /** os vivos da caixa por parto, também os que um casal encerrado deixou nela */
  ninhadas: NinhadaNoCard[]
  /** quantos vivos da caixa estão reservados */
  reservado: number
}

/** Os vivos da caixa de estoque que nasceram no mesmo dia */
export interface GrupoNoCard {
  dtNascimento: DataISO
  idadeDias: number
  total: number
  reservados: number
}

/** A caixa de estoque na célula da grade: os vivos de um sexo e uma linhagem */
export interface EstoqueNoCard {
  sexo: Sexo
  /** a linhagem gravada na caixa: a escolha do destino filtra por ela e pelo sexo */
  idLinhagem: number | null
  total: number
  reservado: number
  /** a data de nascimento do mais velho e do mais novo */
  nascimentoDe: DataISO | null
  nascimentoAte: DataISO | null
  /** os vivos por data de nascimento, do mais velho para o mais novo */
  grupos: GrupoNoCard[]
}

// GET /api/salas: as salas ativas, cada uma com quantas estantes ativas tem
export interface Sala {
  id: number
  nome: string
  estantes: number
}

// GET /api/estantes e GET /api/estantes/:id/grade
export interface Estante {
  id: number
  idSala: number
  /** o nome da sala, que a grade usa para separar as estantes */
  sala: string
  fabricante: string
  modelo: string
  numeroVisivel: string
  faces: number
  linhas: number
  colunas: number
}

/** Na grade só aparece caixa ativa */
export interface CaixaNaGrade {
  id: number
  /** a cor da caixa; null na caixa de casal sem ciclo aberto e sem animais */
  fase: FaseDaCaixa | null
  /** o parto previsto passou sem nascimento, ou filhotes passaram da idade de desmamar */
  atrasado: boolean
  /** a linhagem do casal ou da caixa de estoque: o filtro da Visão geral apaga as outras */
  idLinhagem: number | null
  linhagem: string | null
  casal: CasalNoCard | null
  estoque: EstoqueNoCard | null
}

export interface Posicao {
  linha: number
  coluna: number
  codigo: string
  /** null = posição vazia */
  caixa: CaixaNaGrade | null
}

export interface Grade {
  faces: { face: Face; posicoes: Posicao[] }[]
}

// ------------------------------------------------------------ ficha da caixa (GET /api/caixas/:id)

export interface DadosDaCaixa {
  id: number
  endereco: { numeroVisivel: string; sala: string; codigo: string }
  especie: CodigoEspecie
  /** a fase da caixa, como na grade; null na caixa liberada, que já saiu dela */
  fase: FaseDaCaixa | null
  atrasado: boolean
  ativa: boolean
  dtLiberacao: DataISO | null
  motivoLiberacao: MotivoDaLiberacao | null
}

export interface Casal {
  id: number
  identificacao: string
  grupoMacho: string
  grupoFemea: string
  linhagem: string
  idLinhagem: number
  dtFormacao: DataISO
  ativo: boolean
  dtEncerramento: DataISO | null
}

/** O que um pedido tem reservado, por sexo */
export interface ReservaDoPedido extends PorSexo {
  idPedido: number
}

/** Uma caixa onde estão vivos do parto */
export interface OndeEstao extends PorSexo {
  idCaixa: number
  codigo: string
  numeroVisivel: string
  tipo: TipoDeCaixa
  reservados: number
  /** o que cada pedido tem reservado dos vivos do parto nesta caixa */
  pedidos: ReservaDoPedido[]
}

/** O parto, todo contado nos animais. É também o que as rotas do parto devolvem */
export interface Parto {
  id: number
  /** 1º a 5º */
  ordem: number
  dtAcasalamento: DataISO
  /** calculado do acasalamento */
  dtPartoPrevisto: DataISO
  dtPartoReal: DataISO | null
  /** calculado: parto real (ou previsto) + 22 */
  dtDesmamePrevisto: DataISO
  dtDesmameReal: DataISO | null
  /** o parto pendente de casal encerrado que foi fechado sem ninhada */
  dtSemNinhada: DataISO | null
  motivoSemNinhada: string | null
  /** null enquanto não nasceu; conta todo animal do parto, menos o registro anulado */
  nascidoM: number | null
  nascidoF: number | null
  /** mortos até o dia do desmame, ou até agora se não desmamou: seleção, morte, "não chegou ao desmame" */
  baixasAntesDoDesmame: PorSexo
  /** nascidos menos as baixas antes do desmame; null enquanto não desmamou */
  desmamadoM: number | null
  desmamadoF: number | null
  vivos: PorSexo
  /** onde estão os vivos do parto agora */
  onde: OndeEstao[]
  /** os vivos reservados, por pedido, no parto todo */
  reservados: ReservaDoPedido[]
  entregues: PorSexo
  /** a última baixa de seleção não anulada: o desmame não fica antes dela */
  dtUltimaSelecao: DataISO | null
  /**
   * a primeira mudança ou entrega dos animais do parto, ou a primeira chegada deles numa caixa de
   * estoque: a correção do desmame não passa dela
   */
  dtPrimeiraSaida: DataISO | null
  /** a primeira baixa, mudança ou entrega não anulada dos animais do parto: a correção do nascimento não passa dela */
  dtPrimeiroFato: DataISO | null
}

export interface CasalComPartos {
  casal: Casal
  partos: Parto[]
}

/** A ficha da caixa de casal */
export interface FichaDeCasal {
  tipo: 'casal'
  /**
   * o sexo que a caixa teria se virasse caixa de estoque no lugar: casal encerrado, nenhum parto
   * pendente e só desmamados de um sexo e uma linhagem nela. null quando não pode
   */
  virarEstoque: Sexo | null
  caixa: DadosDaCaixa & { linhagem: string | null; idLinhagem: number | null }
  /** o ativo, ou o mais recente */
  casal: Casal | null
  /** do 1º ao último registrado: no máximo 5 */
  partos: Parto[]
  /** os casais que vieram antes nesta caixa, com os partos deles */
  anteriores: CasalComPartos[]
}

/** De qual parto vieram os vivos de um grupo da caixa de estoque */
export interface OrigemDoGrupo {
  idParto: number
  ordem: number
  casal: string
  /** a caixa do casal */
  codigoOrigem: string
  numeroVisivelOrigem: string
  qtd: number
}

/** Os vivos da caixa de estoque que nasceram no mesmo dia: dentro da caixa, só a idade os separa */
export interface GrupoDoEstoque {
  dtNascimento: DataISO
  idadeDias: number
  total: number
  reservados: number
  livres: number
  origens: OrigemDoGrupo[]
  /** o que cada pedido tem reservado neste grupo */
  pedidos: { idPedido: number; qtd: number }[]
  /** a chegada mais recente dos vivos do grupo na caixa: a baixa e a mudança não ficam antes dela */
  dtChegada: DataISO | null
}

/** A ficha da caixa de estoque: o que tem, de onde veio, para quem está reservado e o que aconteceu */
export interface FichaDeEstoque {
  tipo: 'estoque'
  caixa: DadosDaCaixa & { linhagem: string | null; idLinhagem: number | null; sexo: Sexo }
  total: number
  reservado: number
  livre: number
  nascimentoDe: DataISO | null
  nascimentoAte: DataISO | null
  grupos: GrupoDoEstoque[]
  /** o que cada pedido tem reservado nesta caixa */
  pedidos: { idPedido: number; qtd: number }[]
  /** os casais da caixa, se ela foi de casal antes de virar de estoque */
  casaisAnteriores: CasalComPartos[]
}

export type FichaDaCaixa = FichaDeCasal | FichaDeEstoque

// ------------------------------------------------------------ respostas das ações da colônia

/** POST /api/caixas/:id/baixa */
export interface RespostaDaBaixa {
  /** a baixa lançada: é o que o Desfazer anula */
  idOcorrencia: number
  baixas: PorSexo
  /** a caixa ficou vazia e foi liberada */
  liberada: boolean
  /** os pedidos que ficaram em falta por esta baixa */
  faltas: FaltaDoPedido[]
}

/** POST /api/caixas/:id/mudanca */
export interface RespostaDaMudanca {
  /** para onde foi cada sexo; a caixa nova numa posição vazia vem com o código que ela ganhou */
  caixas: { idCaixa: number; codigo: string; sexo: Sexo; qtd: number }[]
  /** a caixa de origem esvaziou e foi liberada */
  liberada: boolean
}

/** POST /api/ocorrencias/:id/anulacao */
export interface RespostaDaAnulacao {
  /** para onde voltou cada sexo da baixa: a caixa dela ou a caixa de estoque indicada */
  voltaram: { sexo: Sexo; qtd: number; idCaixa: number; codigo: string }[]
  /** os que voltaram livres porque o pedido deles não comporta mais a reserva */
  soltos: PorSexo
}

// ------------------------------------------------------------ pedidos

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

/**
 * enviado (aguardando análise) | aprovado (aceito, sem animais reservados) | reservado (com os
 * animais reservados) | entregue | recusado. Entregue e recusado são finais
 */
export type StatusDoPedido = 'enviado' | 'aprovado' | 'reservado' | 'entregue' | 'recusado'

// GET /api/pedidos
export interface Pedido {
  id: number
  dataPedido: DataISO
  /** só no enviado: o dia em que ele é recusado sozinho */
  prazoResposta: DataISO | null
  /** o dia da aprovação (aprovado, reservado, entregue) */
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
  /** a desejada */
  dataEntrega: DataISO
  /** o dia em que a entrega foi registrada; só no entregue */
  dataEntregue: DataISO | null
  observacoes: string | null
  status: StatusDoPedido
  motivoRecusa: string | null
  /** só no reservado que perdeu animais: o que falta para cobrir o pedido */
  reservaEmFalta: { m: number; f: number; qualquer: number } | null
}

/** POST /api/pedidos/:id/alocacao: a reserva do aprovado inteiro, ou o que completou da falta */
export interface RespostaDaAlocacao {
  idPedido: number
  status: 'reservado'
  reservados: PorSexo
  /** o que ainda falta, quando a reserva completou só parte da falta */
  falta: { m: number; f: number; qualquer: number } | null
}

/** POST /api/pedidos/:id/devolucao: o pedido volta a aprovado e os animais, a ficar livres */
export interface RespostaDaDevolucao {
  idPedido: number
  status: 'aprovado'
  soltos: PorSexo
}

/** POST /api/pedidos/:id/recusa: o reservado também, e os animais dele voltam a ficar livres */
export interface RespostaDaRecusa {
  idPedido: number
  status: 'recusado'
  motivo: string
  soltos: PorSexo
}

/** POST /api/pedidos/:id/entrega */
export interface RespostaDaEntrega {
  idPedido: number
  status: 'entregue'
  dtEntrega: DataISO
  entregues: PorSexo
  /** os códigos das caixas que a entrega esvaziou */
  caixasLiberadas: string[]
}

/** GET /api/pedidos/:id/retirada: onde estão de fato os reservados vivos, na ordem da estante */
export interface LugarDaRetirada {
  tipo: TipoDeCaixa
  codigo: string
  numeroVisivel: string
  sexo: Sexo
  dtNascimento: DataISO
  qtd: number
  /** os partos de onde vieram */
  partos: { ordem: number; casal: string }[]
}

/** 'de_fato': todos do lugar já desmamaram; 'previsao': desmamam até a entrega */
export type Origem = 'de_fato' | 'previsao'

/** Um lugar da busca: a caixa e a data de nascimento, com os livres que tem */
export interface LugarCandidato {
  idCaixa: number
  codigo: string
  numeroVisivel: string
  tipo: TipoDeCaixa
  dtNascimento: DataISO
  idadeNaEntrega: number
  origem: Origem
  livres: PorSexo
  /** os partos de onde vieram, só para mostrar */
  partos: { ordem: number; casal: string }[]
  /** quanto o motor sugere tirar deste lugar */
  alocar: PorSexo
  sugerida: boolean
}

// GET /api/busca
export interface ResultadoDaBusca {
  /** a faixa aceita, com a tolerância */
  faixa: { min: number; max: number }
  /** já na ordem de prioridade: de fato antes de previsão, depois a idade */
  candidatas: LugarCandidato[]
  /** o que o plantel não cobre; o "qualquer" sobra quando nem a sobra das caixas o cobre */
  deficit: PorSexo & { qualquer: number }
  /** quantos casais novos cobririam o deficit, pelo esperado de cada um: é aproximado */
  casaisAFormar: number
  acasalamentoNovo: {
    dataMinimaDeEntrega: DataISO
    viavel: boolean
    /**
     * quando formar os casais para a entrega: antes, os filhotes passam da idade; depois, ficam
     * novos demais ou sem desmamar. Nula quando nenhuma idade aceita chega desmamada
     */
    formarCasais: { de: DataISO; ate: DataISO } | null
    /** quantos acasalamentos, das ninhadas maiores para as menores */
    acasalamentos: { min: number; max: number }
  }
}

// GET /api/visao-geral: os vivos de cada linhagem, contados um a um

/** Uma faixa de idade em dias, com as duas pontas dentro; 'ate' nulo é a última, sem teto */
export interface FaixaDeIdade extends PorSexo {
  de: number
  ate: number | null
}

/** Os livres de uma idade em dias */
export interface IdadeNaVisaoGeral extends PorSexo {
  idade: number
}

export interface LinhagemNaVisaoGeral {
  idLinhagem: number
  linhagem: string
  /** casais ativos */
  casais: number
  /** mamando e desmamados */
  vivos: PorSexo
  /** a parte dos vivos que ainda não desmamou */
  mamando: PorSexo
  /** vivos com pedido */
  reservados: PorSexo
  /** vivos sem pedido, os que mamam inclusive */
  livres: PorSexo
  /** os livres por idade de hoje, sempre nas mesmas 4 faixas e na mesma ordem */
  livresPorIdade: FaixaDeIdade[]
  /** os livres por idade em dias, crescente */
  livresPorIdadeDias?: IdadeNaVisaoGeral[]
}

export interface EspecieNaVisaoGeral {
  codigo: CodigoEspecie
  nome: string
  linhagens: LinhagemNaVisaoGeral[]
}

export interface VisaoGeral {
  especies: EspecieNaVisaoGeral[]
}

// POST /api/pedidos/viabilidade: só se o biotério consegue atender, sem números da colônia
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
  /** de onde veio a linha: o histórico das operações ou a trilha dos animais */
  fonte: 'historico' | 'trilha'
  /** só é único dentro da fonte */
  id: number
  /** quando foi registrado, ISO */
  dataHora: string
  /** 'Sistema' quando não houve pessoa */
  usuario: string
  entidade: string
  idEntidade: number
  /** onde foi, em palavras ("Caixa F1A", "Casal AB (F1A)", "Pedido #3"); null quando a API não diz */
  onde: string | null
  /** na trilha, o tipo da ocorrência: nascimento, baixa, mudanca, reserva, entrega... */
  acao: string
  /** na trilha começa com a data do fato: 'Em aaaa-mm-dd: ' */
  descricao: string
  dados: unknown
}
