import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Os tons da paleta institucional. 'neutro' é o padrão - etiqueta colorida
 * demais deixa de marcar coisa nenhuma
 */
export type TomDeEtiqueta =
  'neutro' | 'informacao' | 'institucional' | 'sucesso' | 'atencao' | 'erro'

/** etiqueta. A grande é para quando ela é o dado principal, como a situação na lista de pedidos */
export function Etiqueta({
  children,
  tom = 'neutro',
  grande = false,
}: {
  children: ReactNode
  tom?: TomDeEtiqueta
  grande?: boolean
}) {
  return (
    <span className={`etiqueta etiqueta--${tom}${grande ? ' etiqueta--grande' : ''}`}>
      {children}
    </span>
  )
}
