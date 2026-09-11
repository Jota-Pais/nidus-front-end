import { useId } from 'react'
import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Um filtro: rótulo em cima, controle embaixo.
 *
 * O rótulo é `<label htmlFor>` de verdade, não `Typography.Text` — que
 * renderiza `<span>` e não associa nada. Sem a associação, o leitor de tela
 * anuncia "caixa de combinação" e mais nada, e o `RNF-10` pede a tela operável
 * sem enxergar.
 *
 * Como o `id` precisa chegar ao controle do Ant Design, `children` pode ser
 * uma função que o recebe:
 *
 * ```tsx
 * <CampoDeFiltro rotulo="Sala">{(id) => <SeletorDeSala id={id} … />}</CampoDeFiltro>
 * ```
 *
 * Passar um nó direto também funciona — só perde a associação, então vale
 * apenas para controle que já traz o próprio `aria-label`.
 */
export function CampoDeFiltro({
  rotulo,
  children,
  largura = 200,
}: {
  rotulo: string
  children: ReactNode | ((id: string) => ReactNode)
  largura?: number | string
}) {
  const id = useId()

  return (
    <div className="campoDeFiltro" style={{ width: largura }}>
      <label className="campoDeFiltro__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      {typeof children === 'function' ? children(id) : children}
    </div>
  )
}
