import { Tooltip } from 'antd'
import type { TooltipProps } from 'antd'
import type { ReactNode } from 'react'

/**
 * Explicação que aparece ao apontar.
 *
 * ⚠️ **Nunca a única fonte de uma informação que importa.** Dica não existe
 * no celular, não existe para quem navega por teclado sem hover e não sai na
 * impressão. Serve para o detalhe a mais — o nome científico da espécie, a
 * descrição do estado, de onde a idade é contada. O dado que decide fica na
 * tela.
 *
 * É o mesmo raciocínio do `RNF-10`: a dica é sempre um canal extra, nunca o
 * primeiro.
 */
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
