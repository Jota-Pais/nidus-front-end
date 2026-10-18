import type { ReactNode } from 'react'
import './estilos.css'

/** Ícone dentro de um quadrado de gradiente */
export function IconeEmCaixa({
  children,
  neutro = false,
}: {
  children: ReactNode
  neutro?: boolean
}) {
  return (
    <span className={`iconeEmCaixa${neutro ? ' iconeEmCaixa--neutro' : ''}`} aria-hidden="true">
      {children}
    </span>
  )
}
