import type { ReactNode } from 'react'
import './estilos.css'

type TomDeTexto = 'normal' | 'secundario' | 'rotulo'

/** Texto da interface */
export function Texto({
  children,
  tom = 'normal',
  className,
}: {
  children: ReactNode
  tom?: TomDeTexto
  className?: string
}) {
  const classes = ['texto', `texto--${tom}`, className].filter(Boolean).join(' ')

  return <span className={classes}>{children}</span>
}
