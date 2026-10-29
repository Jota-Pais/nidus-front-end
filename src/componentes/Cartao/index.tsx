import type { ReactNode } from 'react'
import './estilos.css'

/** Superfície elevada */
export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  const classes = ['cartao', className].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}
