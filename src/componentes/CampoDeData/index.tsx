import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import dayjs from 'dayjs'
import type { DataISO } from '@/dominio/tipos'
import { FORMATO_ARMAZENAMENTO, FORMATO_EXIBICAO, hoje } from '@/lib/data'

/** 'aaaa-mm-dd' Dayjs, ou null se a entrada não for uma data */
function paraDayjs(valor: DataISO | null | undefined) {
  if (!valor) return null
  const data = dayjs(valor, FORMATO_ARMAZENAMENTO, true)
  return data.isValid() ? data : null
}

/** Campo de data que fala DataISO, não Dayjs. */
export function CampoDeData({
  value,
  onChange,
  minimo,
  maximo,
  semFuturo = false,
  ...resto
}: Omit<DatePickerProps, 'value' | 'onChange' | 'format' | 'picker' | 'minDate' | 'maxDate'> & {
  value?: DataISO | null
  onChange?: (valor: DataISO | null) => void
  minimo?: DataISO
  maximo?: DataISO
  semFuturo?: boolean
}) {
  const teto = semFuturo ? (maximo && maximo < hoje() ? maximo : hoje()) : maximo
  const piso = paraDayjs(minimo)
  const tetoDayjs = paraDayjs(teto)

  return (
    <DatePicker
      value={paraDayjs(value)}
      onChange={(data) => onChange?.(data ? data.format(FORMATO_ARMAZENAMENTO) : null)}
      format={FORMATO_EXIBICAO}
      placeholder="dd/mm/aaaa"
      style={{ width: '100%' }}
      {...(piso ? { minDate: piso } : {})}
      {...(tetoDayjs ? { maxDate: tetoDayjs } : {})}
      {...resto}
    />
  )
}
