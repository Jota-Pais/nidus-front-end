/**
 * Fonte única de data e idade no front (`RNF-04`).
 *
 * "Exibição em dd/mm/aaaa. Armazenamento normalizado, fuso único, cálculo de
 * idade em dias inteiros com regra explícita de arredondamento."
 *
 * Nenhuma tela formata data por conta. O dia em que a regra mudar, muda aqui.
 */
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/pt-br'

dayjs.extend(customParseFormat)
dayjs.locale('pt-br')

import type { DataISO } from '@/dominio/tipos'

export const FORMATO_EXIBICAO = 'DD/MM/YYYY'
export const FORMATO_ARMAZENAMENTO = 'YYYY-MM-DD'

/** `aaaa-mm-dd` → `dd/mm/aaaa`. Data ausente vira travessão, nunca "Invalid Date". */
export function formatarData(data: DataISO | null | undefined): string {
  if (!data) return '—'
  const d = dayjs(data, FORMATO_ARMAZENAMENTO, true)
  return d.isValid() ? d.format(FORMATO_EXIBICAO) : '—'
}

/** `dd/mm/aaaa` → `aaaa-mm-dd`. Entrada inválida devolve `null`, não lança. */
export function paraArmazenamento(exibicao: string): DataISO | null {
  const d = dayjs(exibicao, FORMATO_EXIBICAO, true)
  return d.isValid() ? d.format(FORMATO_ARMAZENAMENTO) : null
}

/**
 * Idade em **dias inteiros** de `dataBase` até `dataAlvo`.
 *
 * Regra de arredondamento, explícita como o `RNF-04` exige: as duas datas são
 * normalizadas para o início do dia no mesmo fuso e a diferença é contada em
 * dias completos. Não há fração e não há arredondamento para cima. Um animal
 * nascido dia 1 tem idade 0 no dia 1 e idade 1 no dia 2.
 *
 * ⚠️ **`CONF-01` está em aberto:** a seção 1.6 da spec do cliente conta a idade
 * da **data de nascimento**, a 6.1 conta da **data de desmame**. São 22 dias de
 * diferença e isso desloca todo o resultado do motor. Por isso a base entra
 * como argumento — quando o cliente responder, muda a chamada, não esta função.
 *
 * ⚠️ E o número que o usuário vê **não sai daqui**: `RNF-01` manda o servidor
 * calcular. Esta função serve para rótulo auxiliar e validação de formulário.
 */
export function idadeEmDias(dataBase: DataISO, dataAlvo: DataISO): number {
  const base = dayjs(dataBase, FORMATO_ARMAZENAMENTO, true).startOf('day')
  const alvo = dayjs(dataAlvo, FORMATO_ARMAZENAMENTO, true).startOf('day')
  if (!base.isValid() || !alvo.isValid()) {
    throw new Error(`Data inválida: base="${dataBase}" alvo="${dataAlvo}"`)
  }
  return alvo.diff(base, 'day')
}

/** Soma dias a uma data ISO, devolvendo ISO. Usado só para rótulo, nunca para decidir. */
export function somarDias(data: DataISO, dias: number): DataISO {
  return dayjs(data, FORMATO_ARMAZENAMENTO, true).add(dias, 'day').format(FORMATO_ARMAZENAMENTO)
}

export function hoje(): DataISO {
  return dayjs().format(FORMATO_ARMAZENAMENTO)
}

/**
 * `RF-REP-02` — "datas previstas visualmente distintas das reais: a diferença
 * entre 'vai nascer' e 'nasceu' é a informação mais importante da tela".
 *
 * A ficha nunca mostra uma data solta: mostra a data e o que ela é.
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
