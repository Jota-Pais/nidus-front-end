import type { ElementType, ReactNode } from 'react'
import './estilos.css'

/**
 * 'numero' é o que resolve alinhamento de coluna: monoespaçada com
 * tabular-nums. Todo número que o olho compara - contagem, código de
 * posição, idade - usa este tom
 */
export type TomDeTexto = 'normal' | 'secundario' | 'forte' | 'numero' | 'rotulo'

/** Texto da interface */
export function Texto({
  children,
  tom = 'normal',
  como,
  id,
  className,
  ...resto
}: {
  children: ReactNode
  tom?: TomDeTexto
  como?: ElementType
  id?: string
  className?: string
  htmlFor?: string
  title?: string
  'aria-label'?: string
}) {
  const Marcacao = como ?? 'span'
  const classes = ['texto', `texto--${tom}`, className].filter(Boolean).join(' ')

  return (
    <Marcacao className={classes} {...(id ? { id } : {})} {...resto}>
      {children}
    </Marcacao>
  )
}
