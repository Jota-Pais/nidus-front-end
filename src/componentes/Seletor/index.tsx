import { Select } from 'antd'
import type { SelectProps } from 'antd'

/**
 * Lista de escolha.
 *
 * Base dos seletores de domínio (`SeletorDeEspecie`, `SeletorDeSala`,
 * `SeletorDeEstante`, `SeletorDeParGenetico`), e o que eles herdam:
 *
 * - **largura de 100%.** O padrão do Ant Design encolhe conforme o conteúdo,
 *   e uma faixa de filtros com seletores de larguras diferentes fica torta.
 * - **busca por rótulo quando a lista é longa** — `optionFilterProp="label"`,
 *   senão o Ant Design filtra pelo `value`, que costuma ser um id numérico e
 *   não casa com nada do que o usuário digita.
 * - **texto de "nada encontrado" em português.**
 */
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
