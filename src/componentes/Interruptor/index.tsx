import { Switch } from 'antd'
import type { SwitchProps } from 'antd'

/**
 * Liga/desliga.
 *
 * ⚠️ **Só para o que tem efeito imediato** — mostrar caixas inativas na
 * grade, agrupar por sala. Para o que só vale depois de salvar, use
 * `CaixaDeSelecao`: o interruptor promete que já aconteceu, e um que não
 * aconteceu ensina o usuário a desconfiar da tela.
 *
 * `aria-label` é obrigatório porque o interruptor não tem texto dentro; sem
 * ele o leitor de tela anuncia "botão de alternância" e mais nada.
 */
export function Interruptor({
  rotulo,
  ...props
}: Omit<SwitchProps, 'aria-label'> & { rotulo: string }) {
  return <Switch aria-label={rotulo} {...props} />
}
