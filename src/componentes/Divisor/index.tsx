import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Separação entre blocos.
 *
 * ⚠️ **Use pouco.** O design system separa por espaço em branco, não por
 * linha: o respiro entre seções já é o divisor, e uma régua a cada dois
 * blocos deixa a tela listrada. Vale quando dois blocos precisam ficar juntos
 * (mesmo cartão) mas se lerem como assuntos diferentes.
 *
 * Com `children`, vira rótulo no meio da linha — e aí sai na monoespaçada do
 * design system, não em texto solto.
 */
export function Divisor({ children }: { children?: ReactNode }) {
  if (!children) return <hr className="divisor" />

  return (
    <div className="divisor divisor--comRotulo" role="separator">
      <span className="divisor__rotulo">{children}</span>
    </div>
  )
}
