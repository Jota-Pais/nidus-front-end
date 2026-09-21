import { Select } from 'antd'
import type { Estante } from '@/dominio/estante'

/** Escolha de estante. */
export function SeletorDeEstante({
  estantes,
  value,
  onChange,
  id,
  carregando = false,
}: {
  estantes: Estante[]
  value?: number | null
  onChange?: (valor: number) => void
  id?: string
  carregando?: boolean
}) {
  return (
    <Select<number>
      {...(id ? { id } : {})}
      {...(value === null || value === undefined ? {} : { value })}
      {...(onChange ? { onChange } : {})}
      loading={carregando}
      placeholder="Estante"
      showSearch
      optionFilterProp="label"
      style={{ width: '100%' }}
      options={estantes.map((estante) => ({
        value: estante.id,
        label: `${estante.numeroVisivel} · ${estante.sala} · ${estante.fabricante} ${estante.modelo} (${estante.topologia.capacidade} posições)`,
      }))}
    />
  )
}
