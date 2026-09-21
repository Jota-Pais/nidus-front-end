import { Radio } from 'antd'
import type { RadioGroupProps } from 'antd'

export interface OpcaoDeEscolha<V> {
  valor: V
  rotulo: string
  desabilitada?: boolean
}

/** Escolha única entre poucas opções, todas visíveis */
export function Escolha<V extends string | number>({
  opcoes,
  como = 'radio',
  ...props
}: Omit<RadioGroupProps, 'options' | 'optionType'> & {
  opcoes: OpcaoDeEscolha<V>[]
  como?: 'radio' | 'botoes'
}) {
  return (
    <Radio.Group
      options={opcoes.map((opcao) => ({
        value: opcao.valor,
        label: opcao.rotulo,
        ...(opcao.desabilitada === undefined ? {} : { disabled: opcao.desabilitada }),
      }))}
      {...(como === 'botoes' ? { optionType: 'button' as const, buttonStyle: 'solid' as const } : {})}
      {...props}
    />
  )
}
