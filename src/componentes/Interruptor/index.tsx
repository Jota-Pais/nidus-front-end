import { Switch } from 'antd'
import type { SwitchProps } from 'antd'

/** Liga/desliga. */
export function Interruptor({
  rotulo,
  ...props
}: Omit<SwitchProps, 'aria-label'> & { rotulo: string }) {
  return <Switch aria-label={rotulo} {...props} />
}
