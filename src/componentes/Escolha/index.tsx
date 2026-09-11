import { Radio } from 'antd'
import type { RadioGroupProps } from 'antd'

export interface OpcaoDeEscolha<V> {
  valor: V
  rotulo: string
  desabilitada?: boolean
}

/**
 * Escolha única entre poucas opções, todas visíveis.
 *
 * ⚠️ **Use no lugar de `Seletor` quando forem até quatro opções.** Uma lista
 * que precisa ser aberta para revelar três itens esconde informação por nada,
 * e de luva (`RNF-03`) abrir lista é um toque a mais que pode errar.
 *
 * `como="botoes"` vira um grupo segmentado, para quando a escolha é a própria
 * visão da tela — e não um campo entre outros.
 */
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
