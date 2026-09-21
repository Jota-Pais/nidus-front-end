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
  contorno = false,
  title,
}: {
  children: ReactNode
  tom?: TomDeEtiqueta
  /** Só o contorno, sem preenchimento. Para etiqueta que se repete em lista */
  contorno?: boolean
  title?: string
}) {
  return (
    <span
      className={`etiqueta etiqueta--${tom}${contorno ? ' etiqueta--contorno' : ''}`}
      {...(title ? { title } : {})}
    >
      {children}
    </span>
  )
}
