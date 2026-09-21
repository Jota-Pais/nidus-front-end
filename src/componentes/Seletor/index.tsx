import { Select } from 'antd'
import type { SelectProps } from 'antd'

/** lista de escolha */
export function Seletor<V = string>({
  comBusca = false,
  ...props
}: SelectProps<V> & {
  /** Ligue a partir de umas dez opções. Abaixo disso a busca atrapalha. */
  comBusca?: boolean
}) {
  return (
    <Select<V>
      style={{ width: '100%' }}
      notFoundContent="Nada encontrado."
      {...(comBusca ? { showSearch: true, optionFilterProp: 'label' } : {})}
      {...props}
    />
  )
}
