import type { CSSProperties, ReactNode } from 'react'
import './estilos.css'

/** Superfície elevada */
export function Cartao({
  children,
  className,
  estilo,
}: {
  children: ReactNode
  className?: string
  estilo?: CSSProperties
}) {
  const classes = ['cartao', className].filter(Boolean).join(' ')

  return (
    <div className={classes} style={estilo}>
      {children}
    </div>
  )
}
