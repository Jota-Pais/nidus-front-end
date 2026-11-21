// O pedido de animais, sem tela: como ele se escreve, as situações e o que a equipe pode fazer em
// cada uma. Quem pede e quem atende leem as mesmas frases: o que o pesquisador conferiu é o que a
// equipe lê
import type { TomDeEtiqueta } from '@/componentes'
import { descreverDias, diasAte, hoje } from '@/lib/data'
import type { CodigoEspecie, DataISO, Pedido, PorSexo, StatusDoPedido } from './tipos'

/** Campo vazio do formulário conta como zero */
interface Quantidades {
  machos?: number | null | undefined
  femeas?: number | null | undefined
  qualquer?: number | null | undefined
}

export function totalDeAnimais({ machos, femeas, qualquer }: Quantidades): number {
  return (machos ?? 0) + (femeas ?? 0) + (qualquer ?? 0)
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

/** "1 macho, 2 fêmeas e 3 de qualquer sexo": o que falta num pedido, só com o que não é zero */
export function descreverQuantos({ m, f, qualquer }: PorSexo & { qualquer: number }): string {
  const partes = [
    m > 0 ? contar(m, 'macho', 'machos') : null,
    f > 0 ? contar(f, 'fêmea', 'fêmeas') : null,
    qualquer > 0 ? `${qualquer} de qualquer sexo` : null,
  ].filter((parte) => parte !== null)

  const ultima = partes.pop() ?? 'nenhum animal'
  return partes.length > 0 ? `${partes.join(', ')} e ${ultima}` : ultima
}

/** "falta 1 fêmea", "faltam 2 machos e 1 fêmea": o verbo concorda com quantos animais são */
export function descreverQueFalta(falta: PorSexo & { qualquer: number }): string {
  const total = falta.m + falta.f + falta.qualquer
  return `${total === 1 ? 'falta' : 'faltam'} ${descreverQuantos(falta)}`
}

/**
 * "1 macho reservado", "2 fêmeas reservadas", "2 machos e 1 fêmea reservados": o particípio
 * concorda com os animais, no feminino só quando são todas fêmeas
 */
export function descreverReservados(reservados: PorSexo): string {
  const total = reservados.m + reservados.f
  const genero = reservados.m === 0 && reservados.f > 0 ? 'reservada' : 'reservado'
  return `${descreverQuantos({ ...reservados, qualquer: 0 })} ${genero}${total === 1 ? '' : 's'}`
}

/**
 * Depois de desfazer a reserva ou recusar o pedido reservado: "2 machos e 1 fêmea voltaram a ficar
 * livres". Sem nenhum vivo reservado (todos morreram), null
 */
export function voltaramAFicarLivres(soltos: PorSexo): string | null {
  const total = soltos.m + soltos.f
  if (total === 0) return null

  const quantos = descreverQuantos({ ...soltos, qualquer: 0 })
  return total === 1 ? `${quantos} voltou a ficar livre.` : `${quantos} voltaram a ficar livres.`
}

/** Depois da entrega: "A caixa F2A ficou vazia e foi liberada." Sem caixa liberada, null */
export function descreverCaixasLiberadas(codigos: string[]): string | null {
  if (codigos.length === 0) return null
  if (codigos.length === 1) return `A caixa ${codigos[0]} ficou vazia e foi liberada.`

  const ultima = codigos.at(-1)
  return `As caixas ${codigos.slice(0, -1).join(', ')} e ${ultima} ficaram vazias e foram liberadas.`
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

/** O que a reserva cobre do alvo, com as quantidades no formato do pedido */
export interface ConferenciaDaReserva {
  /** cobre o alvo inteiro, sem faltar nem passar: só assim a API aceita */
  cobre: boolean
  falta: { machos: number; femeas: number; qualquer: number }
  /** o que passou do alvo em cada sexo, e no total */
  aMais: { machos: number; femeas: number; total: number }
}

/**
 * Confere a reserva contra o alvo (o pedido inteiro, ou a falta dele), com a mesma regra da API:
 * os machos e as fêmeas pedidos, e os de qualquer sexo como macho ou fêmea, sem passar do total
 */
export function conferirReserva(
  alvo: { machos: number; femeas: number; qualquer: number },
  reservado: PorSexo,
): ConferenciaDaReserva {
  const total = alvo.machos + alvo.femeas + alvo.qualquer
  const faltaM = Math.max(0, alvo.machos - reservado.m)
  const faltaF = Math.max(0, alvo.femeas - reservado.f)
  const restante = total - reservado.m - reservado.f

  return {
    cobre: faltaM === 0 && faltaF === 0 && restante === 0,
    falta: { machos: faltaM, femeas: faltaF, qualquer: Math.max(0, restante - faltaM - faltaF) },
    aMais: {
      machos: Math.max(0, reservado.m - alvo.machos - alvo.qualquer),
      femeas: Math.max(0, reservado.f - alvo.femeas - alvo.qualquer),
      total: Math.max(0, -restante),
    },
  }
}

/** Um lugar marcado na reserva: quanto se tira dele e quantos livres ele tem agora */
export interface LugarMarcado {
  quantos: PorSexo
  livres: PorSexo
}

/**
 * Se a reserva marcada pode ir para a API: a do pedido enviado ou aprovado só inteira, cobrindo o
 * alvo; a que completa a falta do reservado vai aos poucos, com qualquer quantidade que não passe
 * do alvo. E nenhum lugar dá mais do que tem livre: depois de a busca recarregar, um lugar pode
 * ter menos
 */
export function reservaPodeIr(
  conferencia: ConferenciaDaReserva,
  reservado: PorSexo,
  inteira: boolean,
  lugares: LugarMarcado[] = [],
): boolean {
  if (lugares.some(({ quantos, livres }) => quantos.m > livres.m || quantos.f > livres.f)) {
    return false
  }
  if (inteira) return conferencia.cobre

  const { aMais } = conferencia
  return reservado.m + reservado.f > 0 && aMais.machos + aMais.femeas + aMais.total === 0
}

/**
 * Os sexos que a reserva aceita do alvo: o macho só quando o pedido tem machos ou animais de
 * qualquer sexo, e a fêmea do mesmo jeito. Com "qualquer", os dois servem
 */
export function sexosQueServem(alvo: { machos: number; femeas: number; qualquer: number }): {
  m: boolean
  f: boolean
} {
  return { m: alvo.machos + alvo.qualquer > 0, f: alvo.femeas + alvo.qualquer > 0 }
}

/**
 * Se um lugar da busca pode dar animais ao alvo: tem livre de algum sexo que serve. A busca traz
 * os lugares da linhagem na idade, dos dois sexos; a caixa só de fêmeas não serve ao pedido só de
 * machos
 */
export function lugarServe(
  alvo: { machos: number; femeas: number; qualquer: number },
  livres: PorSexo,
): boolean {
  const serve = sexosQueServem(alvo)
  return (serve.m && livres.m > 0) || (serve.f && livres.f > 0)
}

// ------------------------------------------------------------ situações

/**
 * A etiqueta de cada situação. Quando quem pediu lê outra coisa, o rótulo dele vem à parte: o
 * aprovado ainda sem os animais é trabalho da equipe, e para quem pediu já é pedido aceito. Cada
 * passo tem a sua cor: amarelo espera a decisão, azul está em andamento, verde tem os animais
 * reservados, cinza já foi entregue e vermelho foi recusado
 */
export const SITUACAO_DO_PEDIDO: Record<
  StatusDoPedido,
  { rotulo: string; paraQuemPediu?: string; tomParaQuemPediu?: TomDeEtiqueta; tom: TomDeEtiqueta }
> = {
  enviado: { rotulo: 'Aguardando análise', tom: 'atencao' },
  aprovado: {
    rotulo: 'Aguardando animais',
    paraQuemPediu: 'Aprovado, em andamento',
    tom: 'informacao',
  },
  reservado: {
    rotulo: 'Animais reservados',
    // quem pediu vê o mesmo "Aceito, em andamento" do aprovado, então na mesma cor
    paraQuemPediu: 'Aprovado, em andamento',
    tomParaQuemPediu: 'informacao',
    tom: 'sucesso',
  },
  entregue: { rotulo: 'Entregue', tom: 'neutro' },
  recusado: { rotulo: 'Recusado', tom: 'erro' },
}

/** O que a equipe pode recusar: o reservado também, e os animais dele voltam a ficar livres */
export function podeRecusar(status: StatusDoPedido): boolean {
  return status === 'enviado' || status === 'aprovado' || status === 'reservado'
}

/**
 * Se o pedido recebe reserva agora: o enviado e o aprovado, inteiros (a API aprova o enviado na
 * própria reserva); o reservado, só o que completa a falta
 */
export function recebeReserva(pedido: Pick<Pedido, 'status' | 'reservaEmFalta'>): boolean {
  return (
    pedido.status === 'enviado' ||
    pedido.status === 'aprovado' ||
    (pedido.status === 'reservado' && pedido.reservaEmFalta !== null)
  )
}

/**
 * O que a reserva tem de cobrir: o pedido inteiro no enviado e no aprovado, só a falta no
 * reservado em falta. No formato de conferirReserva
 */
export function alvoDaReserva(
  pedido: Pick<Pedido, 'machos' | 'femeas' | 'qualquer' | 'reservaEmFalta'>,
): { machos: number; femeas: number; qualquer: number } {
  const falta = pedido.reservaEmFalta
  return falta === null
    ? { machos: pedido.machos, femeas: pedido.femeas, qualquer: pedido.qualquer }
    : { machos: falta.m, femeas: falta.f, qualquer: falta.qualquer }
}

// A ordem das colunas de data, na ordem crescente: a seta da coluna inverte. As datas vêm como
// AAAA-MM-DD, então a ordem do texto é a ordem do calendário. No mesmo dia, o número do pedido
// desempata, e o pedido feito antes vem primeiro

/** Pela data do pedido, do mais antigo para o mais novo */
export function compararDataDoPedido(
  a: { id: number; dataPedido: string },
  b: { id: number; dataPedido: string },
): number {
  return a.dataPedido.localeCompare(b.dataPedido) || a.id - b.id
}

/** Pela data de entrega, da mais cedo para a mais tarde */
export function compararDataDeEntrega(
  a: { id: number; dataEntrega: string },
  b: { id: number; dataEntrega: string },
): number {
  return a.dataEntrega.localeCompare(b.dataEntrega) || a.id - b.id
}

export type FiltroDePedido = 'todos' | 'pendentes' | 'aceitos' | 'entregues' | 'recusados'

export const FILTROS_DE_PEDIDO: { valor: FiltroDePedido; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'pendentes', rotulo: 'Aguardando análise' },
  { valor: 'aceitos', rotulo: 'Aprovados' },
  { valor: 'entregues', rotulo: 'Entregues' },
  { valor: 'recusados', rotulo: 'Recusados' },
]

export function entraNoFiltro(filtro: FiltroDePedido, pedido: Pick<Pedido, 'status'>): boolean {
  switch (filtro) {
    case 'todos':
      return true
    case 'pendentes':
      return pedido.status === 'enviado'
    case 'aceitos':
      return pedido.status === 'aprovado' || pedido.status === 'reservado'
    case 'entregues':
      return pedido.status === 'entregue'
    case 'recusados':
      return pedido.status === 'recusado'
  }
}

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
  pedido: Pick<Pedido, 'status' | 'dataEntrega'>,
  hojeEm: DataISO = hoje(),
): string | null {
  if (pedido.status !== 'aprovado') return null

  const dias = diasAte(pedido.dataEntrega, hojeEm)

  if (dias > AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS) return null
  if (dias < 0) return 'Entrega vencida, sem reserva'
  if (dias === 0) return 'Entrega hoje, sem reserva'
  return `Entrega em ${descreverDias(dias)}, sem reserva`
}
