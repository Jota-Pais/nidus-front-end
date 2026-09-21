// fonte única de data e idade no front (RNF-04)
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/pt-br'

dayjs.extend(customParseFormat)
dayjs.locale('pt-br')

import type { DataISO } from '@/dominio/tipos'

export const FORMATO_EXIBICAO = 'DD/MM/YYYY'
export const FORMATO_ARMAZENAMENTO = 'YYYY-MM-DD'

/** 'aaaa-mm-dd' dd/mm/aaaa. Data ausente vira travessão, nunca "Invalid Date" */
export function formatarData(data: DataISO | null | undefined): string {
  if (!data) return '—'
  const d = dayjs(data, FORMATO_ARMAZENAMENTO, true)
  return d.isValid() ? d.format(FORMATO_EXIBICAO) : '—'
}

/** dd/mm/aaaa 'aaaa-mm-dd'. Entrada inválida devolve null, não lança */
export function paraArmazenamento(exibicao: string): DataISO | null {
  const d = dayjs(exibicao, FORMATO_EXIBICAO, true)
  return d.isValid() ? d.format(FORMATO_ARMAZENAMENTO) : null
}

/** Idade em dias inteiros de 'dataBase' até dataAlvo. */
export function idadeEmDias(dataBase: DataISO, dataAlvo: DataISO): number {
  const base = dayjs(dataBase, FORMATO_ARMAZENAMENTO, true).startOf('day')
  const alvo = dayjs(dataAlvo, FORMATO_ARMAZENAMENTO, true).startOf('day')
  if (!base.isValid() || !alvo.isValid()) {
    throw new Error(`Data inválida: base="${dataBase}" alvo="${dataAlvo}"`)
  }
  return alvo.diff(base, 'day')
}

/** Soma dias a uma data ISO, devolvendo ISO. Usado só para rótulo, nunca para decidir */
export function somarDias(data: DataISO, dias: number): DataISO {
  return dayjs(data, FORMATO_ARMAZENAMENTO, true).add(dias, 'day').format(FORMATO_ARMAZENAMENTO)
}

export function hoje(): DataISO {
  return dayjs().format(FORMATO_ARMAZENAMENTO)
}

/**
 * RF-REP-02 - "datas previstas visualmente distintas das reais: a diferença
 * entre 'vai nascer' e 'nasceu' é a informação mais importante da tela"
 */
export type NaturezaData = 'real' | 'previsto'

export function rotularData(
  real: DataISO | null | undefined,
  previsto: DataISO | null | undefined,
): { texto: string; natureza: NaturezaData | null } {
  if (real) return { texto: formatarData(real), natureza: 'real' }
  if (previsto) return { texto: formatarData(previsto), natureza: 'previsto' }
  return { texto: '—', natureza: null }
}
