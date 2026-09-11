import { Select } from 'antd'
import type { Estante } from '@/dominio/estante'

/**
 * Escolha de estante.
 *
 * O rótulo traz **número visível, sala, fabricante, modelo e capacidade** —
 * tudo junto, de propósito. "E-03" sozinho não diz onde a estante fica nem
 * quantas posições tem, e é isso que o técnico precisa saber para decidir se
 * vai até lá. A busca por texto casa com qualquer um desses pedaços.
 *
 * Recebe a lista pronta em vez de consultar: quem já está na tela da grade
 * tem as estantes em mão (`useEstantes`), e um segundo componente
 * consultando por conta significaria dois estados de carregamento
 * discordando na mesma tela.
 */
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
