import type { ReactNode } from 'react'
import './estilos.css'

/** Colunas que viram uma só no celular */
export function Colunas({
  children,
  quantidade = 2,
  minimo = 280,
  espaco = 16,
}: {
  children: ReactNode
  quantidade?: number
  /** Largura mínima de cada coluna, em px. Abaixo disso, empilha */
  minimo?: number
  espaco?: number
}) {
  return (
    <div
      className="colunas"
      style={{
        gap: espaco,
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minimo}px, 100%), 1fr))`,
        maxWidth: `calc(${quantidade} * 100%)`,
      }}
    >
      {children}
    </div>
  )
}
