import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import './estilos.css'

/** As variantes de botão do design system */
export type VarianteDeBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const TIPO_ANT: Record<VarianteDeBotao, ButtonProps['type']> = {
  primario: 'primary',
  secundario: 'default',
  fantasma: 'text',
  perigo: 'primary',
}

/** Botão */
export function Botao({
  variante = 'secundario',
  comSeta = false,
  children,
  className,
  ...resto
}: Omit<ButtonProps, 'type' | 'danger'> & {
  variante?: VarianteDeBotao
  /** para ação que leva a outro lugar. A seta anda no hover. */
  comSeta?: boolean
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
      {comSeta && (
        <span className="botao__seta" aria-hidden="true">
          →
        </span>
      )}
    </Button>
  )
}
