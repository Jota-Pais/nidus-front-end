import type { ReactNode } from 'react'
import './estilos.css'

/** Parágrafo de texto corrido */
export function Paragrafo({
  children,
  secundario = false,
}: {
  children: ReactNode
  secundario?: boolean
}) {
  return (
    <p className={`paragrafo${secundario ? ' paragrafo--secundario' : ''}`}>{children}</p>
  )
}
