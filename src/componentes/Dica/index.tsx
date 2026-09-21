import { Tooltip } from 'antd'
import type { TooltipProps } from 'antd'
import type { ReactNode } from 'react'

/** explicação que aparece ao apontar */
export function Dica({
  texto,
  children,
  ...props
}: Omit<TooltipProps, 'title'> & {
  texto: ReactNode
  children: ReactNode
}) {
  return (
    <Tooltip title={texto} {...props}>
      {children}
    </Tooltip>
  )
}
