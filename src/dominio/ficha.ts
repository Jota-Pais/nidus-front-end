/**
 * Ficha da posição — `contrato-api.md` §6, `GET /api/caixas/:id`.
 *
 * Transcrição do contrato, como manda o `README`: os dois repositórios não
 * compartilham tipos, cada lado escreve os seus a partir do mesmo documento.
 * Mudou a API, muda o contrato nos dois repos e só depois estes tipos.
 *
 * A ficha abre do card da grade e do card do quadro — **a mesma ficha, a mesma
 * fonte** (`RF-CIC-02`: as duas visões nunca divergem).
 */
import type {
  DataISO,
  EstadoCaixa,
  Face,
  FinalidadeCaixa,
  GrauCerteza,
  GrupoGenetico,
  PorSexo,
} from './tipos'

/**
 * Endereço da ficha: o de `tipos.ts` mais o que o técnico usa para achar a
 * caixa andando pela sala — o número visível da estante e a sala.
 */
export interface EnderecoNaFicha {
  idEstante: number
  numeroVisivel: string
  sala: string
  face: Face
  linha: number
  coluna: number
  /** Como a etiqueta aparece na estante real. Ex.: `C3`. */
  codigo: string
}

export interface CaixaNaFicha {
  id: number
  endereco: EnderecoNaFicha
  especie: string
  linhagem: string
  finalidade: FinalidadeCaixa
  estado: EstadoCaixa
  ativa: boolean
}

/** `RF-REP-01` e `RN-02`. O primeiro caractere de `identificacao` é o do macho. */
export interface Casal {
  id: number
  identificacao: string
  grupoMacho: GrupoGenetico
  grupoFemea: GrupoGenetico
  linhagem: string
  dtFormacao: DataISO
  ativo: boolean
  cicloAtual: number
  maxCiclos: number
  /** `RNF-06` — nada é apagado: o casal encerra, não some. */
  dtEncerramento: DataISO | null
  motivoEncerramento: string | null
}

/**
 * Um ciclo reprodutivo do casal. `RN-04` limita a 5 por casal.
 *
 * ⚠️ **Os pares `previsto`/`real` são o requisito, não redundância.** O
 * `RF-REP-02` manda a data prevista ser visualmente distinta da real: "a
 * diferença entre 'vai nascer' e 'nasceu' é a informação mais importante da
 * tela". `dtPartoReal === null` significa que ainda não aconteceu — é o que o
 * componente `DataPrevistaOuReal` lê.
 */
export interface CicloReprodutivo {
  id: number
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
  /** `PEN-02` em aberto (decisão D-03): nulo = seguem na caixa do casal. */
  idCaixaRecria: number | null
  /** `RN-08`, resolvido no servidor. O front exibe, não deduz. */
  grauCerteza: GrauCerteza
  /** ⚠️ Já vem **líquido**, com os compromissos descontados (`RN-09`). */
  disponivel: PorSexo
  comprometido: PorSexo
}

/** `RNF-06` — trilha de auditoria: quem fez, o quê e quando. */
export interface EventoDeAuditoria {
  /** ISO 8601 completo, com fuso. Não é `DataISO` de dia. */
  dataHora: string
  tipo: string
  descricao: string
  autor: string
}

export interface Ficha {
  caixa: CaixaNaFicha
  casal: Casal | null
  /** De 1 a 5 itens (`RN-04`), em ordem crescente de `ordem`. */
  ciclos: CicloReprodutivo[]
  eventos: EventoDeAuditoria[]
}
