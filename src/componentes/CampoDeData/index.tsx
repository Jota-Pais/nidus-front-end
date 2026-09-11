import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import dayjs from 'dayjs'
import type { DataISO } from '@/dominio/tipos'
import { FORMATO_ARMAZENAMENTO, FORMATO_EXIBICAO, hoje } from '@/lib/data'

/** `aaaa-mm-dd` → `Dayjs`, ou `null` se a entrada não for uma data. */
function paraDayjs(valor: DataISO | null | undefined) {
  if (!valor) return null
  const data = dayjs(valor, FORMATO_ARMAZENAMENTO, true)
  return data.isValid() ? data : null
}

/**
 * Campo de data que fala `DataISO`, não `Dayjs`.
 *
 * **É o componente que mais evita bug de data no projeto.** O `DatePicker` do
 * Ant Design entrega e recebe `Dayjs`; o contrato e o estado da tela falam
 * `aaaa-mm-dd`. Cada tela convertendo por conta significa cada tela errando
 * por conta — e erro de data em biotério desloca a cadeia inteira do
 * `RN-05`.
 *
 * O que fica resolvido de uma vez:
 *
 * - **exibição em `dd/mm/aaaa`** (`RNF-04`), tirada de `@/lib/data`, que é a
 *   fonte única do formato;
 * - **`value`/`onChange` em `DataISO`**, então o campo entra direto num
 *   `Form.Item` sem `getValueProps` nem `normalize` na tela;
 * - **data inválida vira `null`**, nunca `Invalid Date` na tela.
 *
 * ⚠️ `semFuturo` bloqueia o calendário depois de hoje — para data de fato
 * consumado (parto real, desmame real, seleção). **Não é validação**: o
 * `RNF-01` mantém a decisão no servidor, e a API continua tendo que recusar.
 * Bloquear aqui só evita a viagem até o 400.
 */
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
