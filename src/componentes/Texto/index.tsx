import type { ElementType, ReactNode } from 'react'
import './estilos.css'

export type TomDeTexto = 'normal' | 'secundario' | 'forte' | 'rotulo'

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
