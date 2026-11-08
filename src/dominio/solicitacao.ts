// Como um pedido de animais se escreve na tela. A solicitação e o atendimento usam as mesmas
// frases: o que o pesquisador conferiu é o que a equipe lê
import { descreverDias, diasAte, hoje } from '@/lib/data'
import type { CodigoEspecie, DataISO, PorSexo, Solicitacao } from './tipos'

/** Campo vazio do formulário conta como zero */
interface Quantidades {
  machos?: number | null | undefined
  femeas?: number | null | undefined
  qualquer?: number | null | undefined
}

export function totalDeAnimais({ machos, femeas, qualquer }: Quantidades): number {
  return (machos ?? 0) + (femeas ?? 0) + (qualquer ?? 0)
}

/** "5 M · 5 F · 10 qualquer sexo", só com as partes que existem */
export function descreverAnimais({ machos, femeas, qualquer }: Quantidades): string {
  const partes = [
    machos ? `${machos} M` : null,
    femeas ? `${femeas} F` : null,
    qualquer ? `${qualquer} qualquer sexo` : null,
  ].filter((parte) => parte !== null)

  return partes.length > 0 ? partes.join(' · ') : '—'
}

/** A espécie no singular e no plural, para contar os animais */
const ESPECIE: Record<CodigoEspecie, [string, string]> = {
  rato: ['rato', 'ratos'],
  camundongo: ['camundongo', 'camundongos'],
}

const contar = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`

/** "6 ratos Wistar": quantos ao todo, a espécie e a linhagem */
export function descreverQuantidadeEEspecie(
  s: Quantidades & { especie: CodigoEspecie; linhagem: string },
): string {
  const [singular, plural] = ESPECIE[s.especie]
  return `${contar(totalDeAnimais(s), singular, plural)} ${s.linhagem}`
}

/**
 * "4 machos · 2 fêmeas", com o de qualquer sexo junto quando o pedido mistura; sem sexo definido,
 * só "qualquer sexo"
 */
export function descreverSexos({ machos, femeas, qualquer }: Quantidades): string {
  const m = machos ?? 0
  const f = femeas ?? 0
  const q = qualquer ?? 0
  if (m === 0 && f === 0) return q > 0 ? 'qualquer sexo' : '—'

  return [
    m ? contar(m, 'macho', 'machos') : null,
    f ? contar(f, 'fêmea', 'fêmeas') : null,
    q ? `${q} de qualquer sexo` : null,
  ]
    .filter((parte) => parte !== null)
    .join(' · ')
}

/** Faixa ("de 20 a 40 dias") ou idade exata: a escolha do pedido e da busca */
export type ModoDeIdade = 'faixa' | 'exata'

/** O que o campo de idade guarda. O máximo vem nulo quando está em branco ou escondido */
export interface CamposDeIdade {
  modoIdade: ModoDeIdade
  idadeMin: number
  idadeMax?: number | null | undefined
}

/** A faixa que vai para a API. Na exata, o máximo é o próprio mínimo, sobre o que tiver ficado */
export function faixaDeIdade({ modoIdade, idadeMin, idadeMax }: CamposDeIdade) {
  return { idadeMin, idadeMax: modoIdade === 'exata' ? idadeMin : (idadeMax ?? idadeMin) }
}

/** "20 a 40 dias", ou "28 dias" quando a idade é exata */
export function descreverIdade({ idadeMin, idadeMax }: { idadeMin: number; idadeMax: number }) {
  return idadeMin === idadeMax ? `${idadeMin} dias` : `${idadeMin} a ${idadeMax} dias`
}

/** O que a reserva cobre do pedido, com as quantidades no formato de descreverAnimais */
export interface ConferenciaDaReserva {
  /** cobre o pedido inteiro, sem faltar nem passar: só assim a API aceita */
  cobre: boolean
  falta: { machos: number; femeas: number; qualquer: number }
  /** o que passou do pedido em cada sexo, e no total */
  aMais: { machos: number; femeas: number; total: number }
}

/**
 * Confere a reserva contra o pedido, com a mesma regra da API: os machos e as fêmeas pedidos,
 * e os de qualquer sexo como macho ou fêmea, sem passar do total
 */
export function conferirReserva(
  pedido: { machos: number; femeas: number; qualquer: number },
  reservado: PorSexo,
): ConferenciaDaReserva {
  const total = pedido.machos + pedido.femeas + pedido.qualquer
  const faltaM = Math.max(0, pedido.machos - reservado.m)
  const faltaF = Math.max(0, pedido.femeas - reservado.f)
  const restante = total - reservado.m - reservado.f

  return {
    cobre: faltaM === 0 && faltaF === 0 && restante === 0,
    falta: { machos: faltaM, femeas: faltaF, qualquer: Math.max(0, restante - faltaM - faltaF) },
    aMais: {
      machos: Math.max(0, reservado.m - pedido.machos - pedido.qualquer),
      femeas: Math.max(0, reservado.f - pedido.femeas - pedido.qualquer),
      total: Math.max(0, -restante),
    },
  }
}

// A ordem das colunas de data, na ordem crescente: a seta da coluna inverte. As datas vêm como
// AAAA-MM-DD, então a ordem do texto é a ordem do calendário. No mesmo dia, o número do pedido
// desempata, e o pedido feito antes vem primeiro

/** Pela data do pedido, do mais antigo para o mais novo */
export function compararDataDoPedido(
  a: { id: number; dataSolicitacao: string },
  b: { id: number; dataSolicitacao: string },
): number {
  return a.dataSolicitacao.localeCompare(b.dataSolicitacao) || a.id - b.id
}

/** Pela data de entrega, da mais cedo para a mais tarde */
export function compararDataDeEntrega(
  a: { id: number; dataEntrega: string },
  b: { id: number; dataEntrega: string },
): number {
  return a.dataEntrega.localeCompare(b.dataEntrega) || a.id - b.id
}

export type FiltroDeSolicitacao = 'todas' | 'pendentes' | 'aceitas' | 'entregues' | 'recusadas'

export const FILTROS_DE_SOLICITACAO: { valor: FiltroDeSolicitacao; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'pendentes', rotulo: 'Pendentes' },
  { valor: 'aceitas', rotulo: 'Aceitas' },
  { valor: 'entregues', rotulo: 'Entregues' },
  { valor: 'recusadas', rotulo: 'Recusadas' },
]

/**
 * Até quantos dias antes da entrega a equipe vê o aviso do pedido aprovado que ainda está sem os
 * animais reservados
 */
export const AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS = 7

/**
 * O aviso para a equipe do pedido aprovado sem reserva com a entrega perto, hoje ou já passada:
 * "Entrega em 3 dias, sem reserva". Fora disso, null
 */
export function avisoDeEntregaSemReserva(
  s: Pick<Solicitacao, 'status' | 'dataEntrega'>,
  hojeEm: DataISO = hoje(),
): string | null {
  if (s.status !== 'em_atendimento') return null

  const dias = diasAte(s.dataEntrega, hojeEm)

  if (dias > AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS) return null
  if (dias < 0) return 'Entrega vencida, sem reserva'
  if (dias === 0) return 'Entrega hoje, sem reserva'
  return `Entrega em ${descreverDias(dias)}, sem reserva`
}

export function entraNoFiltro(filtro: FiltroDeSolicitacao, s: Solicitacao): boolean {
  switch (filtro) {
    case 'todas':
      return true
    case 'pendentes':
      return s.status === 'enviada' || s.status === 'em_analise'
    case 'aceitas':
      return s.status === 'aprovada' || s.status === 'ajustada' || s.status === 'em_atendimento'
    case 'entregues':
      return s.status === 'concluida'
    case 'recusadas':
      return s.status === 'recusada'
  }
}
