import type { ElementType, ReactNode } from 'react'
import './estilos.css'

/**
 * `numero` é o que resolve alinhamento de coluna: monoespaçada com
 * `tabular-nums`. Todo número que o olho compara — contagem, código de
 * posição, idade — usa este tom.
 */
export type TomDeTexto = 'normal' | 'secundario' | 'forte' | 'numero' | 'rotulo'

/**
 * Texto da interface.
 *
 * Cobre o `Typography.Text` do Ant Design com os tons que o projeto de fato
 * usa, e resolve duas coisas que apareciam copiadas em toda tela:
 *
 * - **`rotulo`** é a monoespaçada em caixa alta do design system, a mesma
 *   família do `RotuloDeSecao` um degrau abaixo. Era `Typography.Text
 *   type="secondary"` com `style` inline em cada lugar.
 * - **`numero`** traz `tabular-nums`. Sem isso uma coluna de contagens
 *   dança conforme os dígitos mudam, e o técnico compara errado.
 *
 * `como` troca o elemento renderizado sem mexer na aparência — útil para
 * `<label>`, que precisa ser `<label>` de verdade para associar (`RNF-10`).
 */
export function Texto({
  children,
  tom = 'normal',
  como,
  id,
  className,
  ...resto
}: {
  children: ReactNode
  tom?: TomDeTexto
  como?: ElementType
  id?: string
  className?: string
  htmlFor?: string
  title?: string
  'aria-label'?: string
}) {
  const Marcacao = como ?? 'span'
  const classes = ['texto', `texto--${tom}`, className].filter(Boolean).join(' ')

  return (
    <Marcacao className={classes} {...(id ? { id } : {})} {...resto}>
      {children}
    </Marcacao>
  )
}
