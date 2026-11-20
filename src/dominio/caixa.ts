// As fases da caixa e os partos. As cores vêm dos tokens: a de cada fase é
// --fase-<fase>-fundo/borda/texto, com que a grade de estantes e a ficha pintam a caixa
import { formatarData, formatarDataCurta, hoje } from '@/lib/data'
import { descreverQuantos } from './pedido'
import type {
  Cruzamento,
  DataISO,
  Destino,
  EstoqueNoCard,
  Face,
  FaltaDoPedido,
  FaseDaCaixa,
  FichaDeCasal,
  MotivoDaLiberacao,
  OndeEstao,
  OrigemNaBusca,
  Parto,
  PorSexo,
  Sexo,
} from './tipos'

interface DadosDaFase {
  fase: FaseDaCaixa
  /** o nome na legenda e na etiqueta da ficha */
  rotulo: string
  /** o que a caixa tem, no título da célula da grade */
  legenda: string
}

/** As fases na ordem do ciclo da caixa de casal, e a da caixa de estoque por último */
export const FASES: readonly DadosDaFase[] = [
  { fase: 'acasalado', rotulo: 'Acasalado', legenda: 'casal acasalado, esperando o parto' },
  { fase: 'mamando', rotulo: 'Em aleitamento', legenda: 'filhotes em aleitamento' },
  {
    fase: 'pronto_estoque',
    rotulo: 'Pronto para o estoque',
    legenda: 'desmamados, prontos para o estoque',
  },
  { fase: 'estoque', rotulo: 'Estoque', legenda: 'caixa de estoque' },
]

export const FASE = Object.fromEntries(FASES.map((dados) => [dados.fase, dados])) as Record<
  FaseDaCaixa,
  DadosDaFase
>

/** Quantos dias o filhote mama: o mesmo ALEITAMENTO_DIAS da API. Depois disso, o desmame atrasou */
export const DIAS_DE_ALEITAMENTO = 22

/**
 * Por que a caixa está atrasada, para o título da célula e para a ficha: o parto previsto que
 * passou sem nascimento, os filhotes que passaram da idade de desmamar, ou os dois. Null sem atraso
 */
export function motivoDoAtraso(
  caixa: {
    atrasado: boolean
    casal: {
      partoPrevisto: DataISO | null
      ninhadas: { mamando: boolean; idadeDias: number }[]
    } | null
  },
  hojeEm: DataISO = hoje(),
): string | null {
  if (!caixa.atrasado) return null

  const previsto = caixa.casal?.partoPrevisto ?? null
  const motivos = [
    previsto !== null && previsto < hojeEm
      ? `o parto previsto para ${formatarDataCurta(previsto)} não foi registrado`
      : null,
    caixa.casal?.ninhadas.some(
      (ninhada) => ninhada.mamando && ninhada.idadeDias > DIAS_DE_ALEITAMENTO,
    )
      ? `filhotes com mais de ${DIAS_DE_ALEITAMENTO} dias sem desmame`
      : null,
  ].filter((motivo) => motivo !== null)

  return motivos.length > 0 ? `Atrasado: ${motivos.join(' e ')}` : 'Atrasado'
}

export const MAX_PARTOS_POR_CASAL = 5

/** Os grupos genéticos do macho e da fêmea: A a E, em qualquer par (o cruzamento depende da linhagem) */
export const OPCOES_DE_GRUPO = ['A', 'B', 'C', 'D', 'E'].map((grupo) => ({
  value: grupo,
  label: grupo,
}))

/** Como se cruzam as famílias A-E de uma linhagem, como o gestor escolhe nos Cadastros */
export const NOME_DO_CRUZAMENTO: Record<Cruzamento, string> = {
  rodizio: 'Rodízio (heterogênica)',
  mesma_letra: 'Mesma letra (isogênica)',
}

/** No rodízio, o grupo do macho vai com o seguinte na fêmea: A com B, B com C ... E com A */
const PROXIMO_GRUPO: Record<string, string> = { A: 'B', B: 'C', C: 'D', D: 'E', E: 'A' }

/**
 * O que o par foge da regra de cruzamento da linhagem, em texto; null se segue a regra, se falta
 * escolher a linhagem ou um dos grupos, ou se a linhagem não tem regra. Só avisa: o casal é
 * salvo do mesmo jeito
 */
export function foraDaRegraDeCruzamento(
  linhagem: { nome: string; cruzamento: Cruzamento | null } | undefined,
  macho: string | undefined,
  femea: string | undefined,
): string | null {
  if (!linhagem?.cruzamento || !macho || !femea) return null

  if (linhagem.cruzamento === 'rodizio') {
    const par = PROXIMO_GRUPO[macho]
    return femea === par
      ? null
      : `A ${linhagem.nome} é heterogênica: no rodízio, o macho ${macho} vai com a fêmea ${par}.`
  }

  return femea === macho
    ? null
    : `A ${linhagem.nome} é isogênica: o macho ${macho} vai com a fêmea ${macho}.`
}

/** Os partos do casal, do 1º ao 5º: em qual ele está quando entra no Nidus */
export const OPCOES_DE_PARTO = Array.from({ length: MAX_PARTOS_POR_CASAL }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}º`,
}))

export const SIMBOLO_DO_SEXO: Record<Sexo, string> = { M: '♂', F: '♀' }

export const SEXOS: readonly Sexo[] = ['M', 'F']

export const ROTULO_DO_SEXO: Record<Sexo, string> = { M: 'Machos', F: 'Fêmeas' }

/** No máximo quantas caixas recebem os animais de um sexo numa mudança, como a API aceita */
export const PARTES_POR_SEXO = 20

/** O grupo de cada sexo no corpo da mudança, e o nome dele nos formulários */
export const CAMPO_DO_SEXO: Record<Sexo, 'machos' | 'femeas'> = { M: 'machos', F: 'femeas' }

/** Quantos são do sexo: o 'm' ou o 'f' */
export function doSexo(quantos: PorSexo, sexo: Sexo): number {
  return sexo === 'M' ? quantos.m : quantos.f
}

/**
 * Quantos animais a mais a correção do nascimento cria, por sexo. Um sexo que sobe enquanto o
 * outro desce é troca de sexo (eram machos registrados como fêmeas), e não animal novo: é a mesma
 * conta da API. Só o que sobra da troca precisa de lugar
 */
export function aMaisNaCorrecao(atual: PorSexo, nova: PorSexo): PorSexo {
  const m = nova.m - atual.m
  const f = nova.f - atual.f
  const troca = m > 0 && f < 0 ? Math.min(m, -f) : f > 0 && m < 0 ? Math.min(f, -m) : 0

  return { m: Math.max(m - troca, 0), f: Math.max(f - troca, 0) }
}

/** Os vivos do parto que estão na caixa; nenhum, undefined */
export function vivosNaCaixa(parto: Pick<Parto, 'onde'>, idCaixa: number): OndeEstao | undefined {
  return parto.onde.find((lugar) => lugar.idCaixa === idCaixa && lugar.m + lugar.f > 0)
}

/**
 * Os pedidos com reservados do parto: as opções quando a API pede de qual pedido saem os animais
 * da seleção, do desmame ou da correção, que tiram do parto todo
 */
export const pedidosDoParto = (parto: Pick<Parto, 'reservados'>) =>
  parto.reservados.map((reserva) => reserva.idPedido)

/**
 * A seleção é antes do desmame, e não limita a data dele: com o desmame antes da última seleção, as
 * seleções depois da data passam para ela (a API leva). O aviso diz isso embaixo do campo, no
 * registro e na correção do desmame
 */
export function avisoDaSelecao(dtUltimaSelecao: DataISO | null) {
  return (data: DataISO | undefined) =>
    data && dtUltimaSelecao && data < dtUltimaSelecao
      ? `As eutanásias de seleção de ${formatarData(dtUltimaSelecao)} passam para a data do desmame.`
      : null
}

/**
 * As causas da baixa como o formulário as mostra. Antes do desmame elas são os índices do
 * aleitamento: a eutanásia é o ajuste de ninhada (a seleção) e a morte é a morte no aleitamento.
 * O registro da baixa e a correção dela no lápis Editar mostram as mesmas
 */
export const CAUSAS_DA_BAIXA: Record<
  'aleitamento' | 'depois',
  { value: 'morte' | 'eutanasia'; label: string }[]
> = {
  aleitamento: [
    { value: 'morte', label: 'Morte no aleitamento' },
    { value: 'eutanasia', label: 'Eutanásia (ajuste de ninhada)' },
  ],
  depois: [
    { value: 'morte', label: 'Morte' },
    { value: 'eutanasia', label: 'Eutanásia' },
  ],
}

/** Os números dos partos antes do primeiro registrado: o cadastro inicial, de antes do Nidus */
export function partosAntesDoNidus(partoInicial: number): number[] {
  return Array.from({ length: Math.max(partoInicial - 1, 0) }, (_, i) => i + 1)
}

/** "1º parto antes do Nidus", "1º e 2º partos antes do Nidus", "1º, 2º e 3º partos antes do Nidus" */
export function descreverPartosAntesDoNidus(partoInicial: number): string | null {
  const ordens = partosAntesDoNidus(partoInicial).map((n) => `${n}º`)
  if (ordens.length === 0) return null

  const lista =
    ordens.length === 1 ? ordens[0] : `${ordens.slice(0, -1).join(', ')} e ${ordens.at(-1)}`
  return `${lista} ${ordens.length === 1 ? 'parto' : 'partos'} antes do Nidus`
}

/** De onde vieram os animais: "2º parto do casal AB", ou "cadastro inicial" sem casal nem parto */
export function descreverOrigem(origem: OrigemNaBusca): string {
  return origem.ordem === null || origem.casal === null
    ? 'cadastro inicial'
    : `${origem.ordem}º parto do casal ${origem.casal}`
}

/** Os animais são todos do cadastro inicial: nenhuma origem tem casal nem parto */
export function ehCadastroInicial(origens: OrigemNaBusca[]): boolean {
  return origens.length > 0 && origens.every((o) => o.ordem === null || o.casal === null)
}

/** As origens sem repetir o cadastro inicial: "2º parto do casal AB, cadastro inicial" */
export function descreverOrigens(origens: OrigemNaBusca[]): string {
  return [...new Set(origens.map(descreverOrigem))].join(', ')
}

/** Todos os partos que passaram pela caixa de casal: os do casal dela e os dos casais de antes */
export function partosDaCaixa(ficha: Pick<FichaDeCasal, 'partos' | 'anteriores'>): Parto[] {
  return [...ficha.partos, ...ficha.anteriores.flatMap((anterior) => anterior.partos)]
}

/** Um lugar clicado na estante: uma caixa que já existe (idCaixa) ou uma posição vazia */
export interface LugarNaEstante {
  idEstante: number
  codigo: string
  face: Face
  linha: number
  coluna: number
  idCaixa: number | null
}

/** O destino que a API espera: a caixa clicada, ou a posição vazia onde nasce uma caixa nova */
export function destinoDoLugar(lugar: LugarNaEstante): Destino {
  if (lugar.idCaixa !== null) return { idCaixa: lugar.idCaixa }

  const { idEstante, face, linha, coluna } = lugar
  return { posicao: { idEstante, face, linha, coluna } }
}

const POR_QUE_LIBEROU: Record<MotivoDaLiberacao, string> = {
  entrega: 'a entrega levou os últimos animais',
  baixa: 'a baixa dos últimos animais a esvaziou',
  mudanca: 'os últimos animais passaram para outra caixa',
  casal_encerrado: 'o casal encerrou sem animais nela',
}

/** "Caixa liberada em 08/11/2026: a entrega levou os últimos animais. ..." */
export function descreverLiberacao(
  dtLiberacao: DataISO | null,
  motivo: MotivoDaLiberacao | null,
): string {
  const porque = motivo === null ? '' : `: ${POR_QUE_LIBEROU[motivo]}`
  return `Caixa liberada em ${formatarData(dtLiberacao)}${porque}. A posição recebe caixa nova.`
}

/** "6 machos" / "1 fêmea" */
export function contarDoSexo(qtd: number, sexo: Sexo): string {
  if (sexo === 'M') return `${qtd} ${qtd === 1 ? 'macho' : 'machos'}`
  return `${qtd} ${qtd === 1 ? 'fêmea' : 'fêmeas'}`
}

/** "reservado", "reservadas": concorda com o sexo e com quantos são */
function reservadoDoSexo(qtd: number, sexo: Sexo): string {
  return `${sexo === 'F' ? 'reservada' : 'reservado'}${qtd === 1 ? '' : 's'}`
}

/** "2 reservados", "1 reservada", "0 reservadas": os reservados de uma caixa de um sexo só */
export function reservadosDoSexo(qtd: number, sexo: Sexo): string {
  return `${qtd} ${reservadoDoSexo(qtd, sexo)}`
}

/** ", 2 reservados", ", todas reservadas" ou nada, depois de quantos animais há */
function quantosReservados(reservados: number, total: number, sexo: Sexo): string {
  if (reservados === 0) return ''
  if (reservados === total) {
    return total === 1
      ? `, ${reservadoDoSexo(1, sexo)}`
      : `, ${sexo === 'F' ? 'todas' : 'todos'} ${reservadoDoSexo(total, sexo)}`
  }
  return `, ${reservadosDoSexo(reservados, sexo)}`
}

/** O que a caixa de estoque tem, numa linha: "6 machos, 2 reservados", "3 fêmeas, todas reservadas" */
export function descreverEstoque(
  estoque: Pick<EstoqueNoCard, 'sexo' | 'total' | 'reservado'>,
): string {
  return `${contarDoSexo(estoque.total, estoque.sexo)}${quantosReservados(estoque.reservado, estoque.total, estoque.sexo)}`
}

/**
 * Os pedidos que perderam animais reservados numa baixa, numa seleção, num desmame ou numa
 * correção: o que falta em cada um, e o que a equipe pode fazer. Sem falta, null
 */
export function descreverFalta(faltas: FaltaDoPedido[]): string | null {
  if (faltas.length === 0) return null

  const cada = faltas.map((falta) => `#${falta.idPedido}, ${descreverQuantos(falta)}`).join('; ')
  const quem = faltas.length === 1 ? 'O pedido ficou' : 'Os pedidos ficaram'

  return (
    `${quem} com animais a menos que a reserva (reserva em falta): ${cada}. ` +
    'Em Pedidos, a reserva em falta pode ser completada com outros animais ou desfeita.'
  )
}
