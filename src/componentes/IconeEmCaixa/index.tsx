import type { ReactNode } from 'react'
import './estilos.css'

/** Ícone dentro de um quadrado de gradiente */
export function IconeEmCaixa({
  children,
  tamanho = 'md',
  neutro = false,
}: {
  children: ReactNode
  tamanho?: 'sm' | 'md' | 'lg'
  neutro?: boolean
}) {
  return (
    <span
      className={`iconeEmCaixa iconeEmCaixa--${tamanho}${neutro ? ' iconeEmCaixa--neutro' : ''}`}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}
