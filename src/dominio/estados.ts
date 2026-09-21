// fonte única da codificação visual de estado
import type { EstadoCaixa, GrauCerteza } from './tipos'

export interface CodificacaoVisual {
  rotulo: string
  /** segundo canal 1 - forma. Legível em P&B. */
  marcador: string
  /** Segundo canal 2 - texto curto, para o card e o leitor de tela */
  sigla: string
  descricao: string
}

export const ESTADO_CAIXA: Record<EstadoCaixa, CodificacaoVisual> = {
  em_reproducao: {
    rotulo: 'Em reprodução',
    marcador: '●',
    sigla: 'REP',
    descricao: 'Casal ativo, nenhuma cria comprometida.',
  },
  parcialmente_comprometida: {
    rotulo: 'Parcialmente comprometida',
    marcador: '◐',
    sigla: 'PAR',
    descricao: 'Parte da ninhada reservada; ainda há saldo ofertável.',
  },
  totalmente_comprometida: {
    rotulo: 'Totalmente comprometida',
    marcador: '◼',
    sigla: 'TOT',
    descricao: 'Toda a ninhada disponível está reservada.',
  },
  preparada_para_envio: {
    rotulo: 'Preparada para envio',
    marcador: '▲',
    sigla: 'ENV',
    descricao: 'Animais separados e conferidos, aguardando expedição.',
  },
  expedida: {
    rotulo: 'Expedida',
    marcador: '✓',
    sigla: 'EXP',
    descricao: 'Entregues; saíram da tutela do CPMR.',
  },
}

/** Ordem das 5 colunas do quadro (RF-CIC-01) */
export const COLUNAS_DO_QUADRO: EstadoCaixa[] = [
  'em_reproducao',
  'parcialmente_comprometida',
  'totalmente_comprometida',
  'preparada_para_envio',
  'expedida',
]

/**
 * RN-08 - grau de certeza. A ordem aqui é a de consumo do RF-MOT-04: confirmado primeiro,
 * projetado por último.
 */
export const GRAU_CERTEZA: Record<GrauCerteza, CodificacaoVisual> = {
  confirmado: {
    rotulo: 'Confirmado',
    marcador: '■',
    sigla: 'CONF',
    descricao: 'Já nasceu e já desmamou — contagem real.',
  },
  previsto: {
    rotulo: 'Previsto',
    marcador: '◧',
    sigla: 'PREV',
    descricao: 'Já nasceu, desmame estimado: quantidade real, data estimada.',
  },
  projetado: {
    rotulo: 'Projetado',
    marcador: '□',
    sigla: 'PROJ',
    descricao: 'Ainda não nasceu: quantidade e data estimadas.',
  },
}

export const ORDEM_GRAU_CERTEZA: GrauCerteza[] = ['confirmado', 'previsto', 'projetado']
