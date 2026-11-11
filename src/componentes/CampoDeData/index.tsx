import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { AriaAttributes } from 'react'
import type { DataISO } from '@/dominio/tipos'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
// '@/lib/data' também deixa o dayjs em português, para o calendário
import { FORMATO_DA_API, hoje } from '@/lib/data'

/** O primeiro é o que aparece; os outros só valem para digitar, com ou sem as barras */
const FORMATOS = ['DD/MM/YYYY', 'DDMMYYYY', 'D/M/YYYY']

/** O que o Form.Item do antd injeta no campo (valor, id e os aria-*), mais os limites */
type Props = AriaAttributes & {
  /** 'aaaa-mm-dd', o formato da API */
  value?: DataISO | null | undefined
  onChange?: ((valor: DataISO | undefined) => void) | undefined
  id?: string
  disabled?: boolean
  className?: string
  /** o primeiro dia que dá para escolher, em 'aaaa-mm-dd' */
  min?: DataISO | undefined
  /** o último dia que dá para escolher, em 'aaaa-mm-dd' */
  max?: DataISO | undefined
}

const paraDia = (data: DataISO): Dayjs => dayjs(data, FORMATO_DA_API, true)

/**
 * O mês em que o calendário abre: o do valor, se já há um; senão o de hoje (o do servidor), se hoje
 * cabe entre os limites; senão o do limite mais próximo
 */
function mesDeAbertura(
  valor: DataISO | null | undefined,
  min: DataISO | undefined,
  max: DataISO | undefined,
): Dayjs {
  if (valor) return paraDia(valor)
  const agora = paraDia(hoje())
  if (min !== undefined && agora.isBefore(paraDia(min), 'day')) return paraDia(min)
  if (max !== undefined && agora.isAfter(paraDia(max), 'day')) return paraDia(max)
  return agora
}

/**
 * Campo de data sempre em dd/mm/aaaa. O campo nativo do navegador segue o idioma do navegador,
 * e num navegador em inglês aparecia mm/dd/aaaa. O valor continua 'aaaa-mm-dd', como a API e
 * as regras do formulário esperam.
 *
 * No celular o campo não abre o teclado: o dia se escolhe no calendário, que o teclado cobriria
 */
export function CampoDeData({ value, onChange, min, max, ...resto }: Props) {
  const estreita = useTelaEstreita()

  return (
    <DatePicker
      {...resto}
      inputReadOnly={estreita}
      value={value ? paraDia(value) : null}
      defaultPickerValue={mesDeAbertura(value, min, max)}
      onChange={(dia: Dayjs | null) => onChange?.(dia ? dia.format(FORMATO_DA_API) : undefined)}
      format={FORMATOS}
      placeholder="dd/mm/aaaa"
      {...(min === undefined ? {} : { minDate: paraDia(min) })}
      {...(max === undefined ? {} : { maxDate: paraDia(max) })}
      style={{ width: '100%' }}
    />
  )
}
