import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Parágrafo de texto corrido.
 *
 * Entrelinha de 1.625 e largura máxima de 68 caracteres — o design system
 * pede `relaxed`, e a medida existe porque linha muito longa faz o olho
 * perder o começo da seguinte. É o tipo de coisa que ninguém nota quando
 * está certa e todo mundo sente quando está errada.
 */
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
