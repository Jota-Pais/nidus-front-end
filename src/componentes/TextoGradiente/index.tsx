import type { ReactNode } from 'react'
import './estilos.css'

/** realce de gradiente numa palavra do título */
export function TextoGradiente({
  children,
  sublinhado = false,
}: {
  children: ReactNode
  sublinhado?: boolean
}) {
  if (sublinhado) {
    return (
      <span className="textoGradienteBarra">
        {children}
        <span className="textoGradienteBarra__marca" aria-hidden="true" />
      </span>
    )
  }
  return <span className="textoGradiente">{children}</span>
}
