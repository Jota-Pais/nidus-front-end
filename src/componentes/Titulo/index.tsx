import type { ReactNode } from 'react'
import { TextoGradiente } from '../TextoGradiente'
import './estilos.css'

/** Título */
export function Titulo({
  children,
  nivel = 2,
  realce,
  id,
}: {
  children: ReactNode
  /** 1 só na tela de entrada. 2 é o título de tela, 3 o de seção */
  nivel?: 1 | 2 | 3 | 4
  realce?: string
  id?: string
}) {
  const Marcacao = `h${nivel}` as const

  return (
    <Marcacao className={`titulo titulo--${nivel}`} {...(id ? { id } : {})}>
      {children}
      {realce && nivel <= 2 && (
        <>
          {' '}
          <TextoGradiente>{realce}</TextoGradiente>
        </>
      )}
      {realce && nivel > 2 && <> {realce}</>}
    </Marcacao>
  )
}
