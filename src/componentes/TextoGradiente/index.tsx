import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Realce de gradiente numa palavra do título.
 *
 * ⚠️ **Uma palavra, nunca a frase.** O design system usa o realce como âncora
 * do olho: se a linha inteira é gradiente, não há âncora nenhuma e o título
 * fica ilegível sobre fundo claro.
 *
 * `sublinhado` troca o gradiente no texto por uma barra de gradiente sob a
 * palavra. Vale quando a linha precisa manter contraste pleno — texto em
 * gradiente perde contraste nas pontas claras, e num título pequeno isso
 * derruba o AA que o `RNF-10` exige.
 */
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
