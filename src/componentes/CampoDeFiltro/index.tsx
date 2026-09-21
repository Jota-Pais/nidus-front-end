import { useId } from 'react'
import type { ReactNode } from 'react'
import './estilos.css'

/** Um filtro: rótulo em cima, controle embaixo. */
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
