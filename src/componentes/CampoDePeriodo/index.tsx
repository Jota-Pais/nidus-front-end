import { DatePicker } from 'antd'
import type { TimeRangePickerProps } from 'antd'
import dayjs from 'dayjs'
import type { DataISO } from '@/dominio/tipos'
import { FORMATO_ARMAZENAMENTO, FORMATO_EXIBICAO } from '@/lib/data'

const { RangePicker } = DatePicker

/** Início e fim, os dois em `aaaa-mm-dd`. Qualquer ponta pode faltar. */
export type Periodo = [DataISO | null, DataISO | null]

function paraDayjs(valor: DataISO | null | undefined) {
  if (!valor) return null
  const data = dayjs(valor, FORMATO_ARMAZENAMENTO, true)
  return data.isValid() ? data : null
}

/**
 * Janela de datas — `RF-CIC-05`, o filtro por "datas previstas dentro de".
 *
 * Mesma razão de existir do `CampoDeData`: o Ant Design fala `Dayjs`, o
 * contrato fala `aaaa-mm-dd` (`dtPrevistaDe` e `dtPrevistaAte` na query do
 * quadro). A conversão acontece uma vez, aqui.
 *
 * As duas pontas podem vir vazias: "de hoje em diante" e "até o fim do mês"
 * são filtros legítimos, e obrigar as duas datas transformaria um filtro
 * simples num formulário.
 */
export function CampoDePeriodo({
  value,
  onChange,
  ...resto
}: Omit<TimeRangePickerProps, 'value' | 'onChange' | 'format' | 'picker'> & {
  value?: Periodo | null
  onChange?: (valor: Periodo | null) => void
}) {
  const [de, ate] = value ?? [null, null]

  return (
    <RangePicker
      value={[paraDayjs(de), paraDayjs(ate)]}
      onChange={(intervalo) => {
        if (!intervalo) return onChange?.(null)
        const [inicio, fim] = intervalo
        onChange?.([
          inicio ? inicio.format(FORMATO_ARMAZENAMENTO) : null,
          fim ? fim.format(FORMATO_ARMAZENAMENTO) : null,
        ])
      }}
      format={FORMATO_EXIBICAO}
      placeholder={['dd/mm/aaaa', 'dd/mm/aaaa']}
      allowEmpty={[true, true]}
      style={{ width: '100%' }}
      {...resto}
    />
  )
}
