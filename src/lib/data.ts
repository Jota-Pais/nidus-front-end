// Datas na tela: a API manda 'aaaa-mm-dd', a tela mostra dd/mm/aaaa
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/pt-br'
import type { DataISO } from '@/dominio/tipos'

dayjs.extend(customParseFormat)
dayjs.locale('pt-br')

const FORMATO_DA_API = 'YYYY-MM-DD'

function formatar(data: DataISO | null | undefined, formato: string): string {
  if (!data) return '—'
  const d = dayjs(data, FORMATO_DA_API, true)
  return d.isValid() ? d.format(formato) : '—'
}

/** 'aaaa-mm-dd' -> dd/mm/aaaa. Data ausente vira travessão, nunca "Invalid Date" */
export function formatarData(data: DataISO | null | undefined): string {
  return formatar(data, 'DD/MM/YYYY')
}

/** 'aaaa-mm-dd' -> dd/mm, o "P:dd/mm" do card */
export function formatarDataCurta(data: DataISO | null | undefined): string {
  return formatar(data, 'DD/MM')
}

/** hoje em 'aaaa-mm-dd', o valor padrão dos campos de data */
export function hoje(): DataISO {
  return dayjs().format(FORMATO_DA_API)
}
