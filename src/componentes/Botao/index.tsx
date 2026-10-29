import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import './estilos.css'

/** As variantes de botão do design system */
type VarianteDeBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const TIPO_ANT: Record<VarianteDeBotao, ButtonProps['type']> = {
  primario: 'primary',
  secundario: 'default',
  fantasma: 'text',
  perigo: 'primary',
}

/** Botão */
export function Botao({
  variante = 'secundario',
  children,
  className,
  ...resto
}: Omit<ButtonProps, 'type' | 'danger'> & {
  variante?: VarianteDeBotao
  children?: ReactNode
}) {
  return (
    <Button
      type={TIPO_ANT[variante] ?? 'default'}
      danger={variante === 'perigo'}
      className={['botao', `botao--${variante}`, className].filter(Boolean).join(' ')}
      {...resto}
    >
      {children}
    </Button>
  )
}
