import type { ReactNode } from 'react'
import { PontoPulsante } from '../PontoPulsante'
import './estilos.css'

/** A pílula que abre cada seção - assinatura do design system */
export function RotuloDeSecao({ children }: { children: ReactNode }) {
  return (
    <span className="rotuloDeSecao">
      <PontoPulsante />
      <span className="rotuloDeSecao__texto">{children}</span>
    </span>
  )
}
