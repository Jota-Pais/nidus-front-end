import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Os tons da paleta institucional. 'neutro' é o padrão - etiqueta colorida
 * demais deixa de marcar coisa nenhuma
 */
export type TomDeEtiqueta = 'neutro' | 'acento' | 'institucional' | 'sucesso' | 'atencao' | 'erro'

/** etiqueta. */
export function Etiqueta({
  children,
  tom = 'neutro',
}: {
  children: ReactNode
  tom?: TomDeEtiqueta
}) {
  return <span className={`etiqueta etiqueta--${tom}`}>{children}</span>
}
