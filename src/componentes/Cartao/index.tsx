import type { CSSProperties, ReactNode } from 'react'
import './estilos.css'

/** 'padrao' é o cartão de todo dia. elevado sobe no hover, para cartão clicável. */
export type VarianteDeCartao = 'padrao' | 'elevado' | 'destacado'

/** Superfície elevada */
export function Cartao({
  children,
  variante = 'padrao',
  aoClicar,
  className,
  estilo,
}: {
  children: ReactNode
  variante?: VarianteDeCartao
  /** passando isto o cartão vira <button>: foco, Enter e Espaço de graça. */
  aoClicar?: () => void
  className?: string
  estilo?: CSSProperties
}) {
  const classes = ['cartao', `cartao--${variante}`, aoClicar && 'cartao--clicavel', className]
    .filter(Boolean)
    .join(' ')

  const corpo = aoClicar ? (
    <button type="button" className={classes} style={estilo} onClick={aoClicar}>
      {children}
    </button>
  ) : (
    <div className={classes} style={estilo}>
      {children}
    </div>
  )

  if (variante !== 'destacado') return corpo

  return <div className="cartao__moldura">{corpo}</div>
}
