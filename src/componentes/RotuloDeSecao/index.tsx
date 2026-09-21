import type { ReactNode } from 'react'
import { PontoPulsante } from '../PontoPulsante'
import './estilos.css'

/** A pílula que abre cada seção - assinatura do design system */
export function RotuloDeSecao({
  children,
  cor = 'acento',
  pulsando = false,
}: {
  children: ReactNode
  cor?: 'acento' | 'aviso' | 'erro' | 'sucesso'
  pulsando?: boolean
}) {
  return (
    <span className={`rotuloDeSecao rotuloDeSecao--${cor}`}>
      <PontoPulsante cor={cor} pulsando={pulsando} />
      <span className="rotuloDeSecao__texto">{children}</span>
    </span>
  )
}
