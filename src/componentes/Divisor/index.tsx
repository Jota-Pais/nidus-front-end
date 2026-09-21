import type { ReactNode } from 'react'
import './estilos.css'

/** Separação entre blocos */
export function Divisor({ children }: { children?: ReactNode }) {
  if (!children) return <hr className="divisor" />

  return (
    <div className="divisor divisor--comRotulo" role="separator">
      <span className="divisor__rotulo">{children}</span>
    </div>
  )
}
