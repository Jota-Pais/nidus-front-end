// As peças da ficha da caixa, a de casal e a de estoque: o campo com rótulo, a linha de campos e
// o total. O estilo está em FichaDaCaixa.css
import type { ReactNode } from 'react'
import { Texto } from '@/componentes'

export function Campo({
  rotulo,
  children,
  destaque = false,
}: {
  rotulo: string
  children: ReactNode
  destaque?: boolean
}) {
  return (
    <div className="ficha__campo">
      <Texto tom="rotulo">{rotulo}</Texto>
      <span className={`ficha__valor${destaque ? ' ficha__valor--destaque' : ''}`}>{children}</span>
    </div>
  )
}

/** dois ou três campos lado a lado */
export function LadoALado({ children }: { children: ReactNode }) {
  return <div className="ficha__linha">{children}</div>
}

export function Total({ children }: { children: ReactNode }) {
  return <div className="ficha__total">{children}</div>
}
