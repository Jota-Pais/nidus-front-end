import type { ReactNode } from 'react'
import './estilos.css'

/** A pílula que abre cada seção - assinatura do design system */
export function RotuloDeSecao({ children }: { children: ReactNode }) {
  return (
    <span className="rotuloDeSecao">
      <span className="rotuloDeSecao__ponto" aria-hidden="true" />
      <span className="rotuloDeSecao__texto">{children}</span>
    </span>
  )
}
