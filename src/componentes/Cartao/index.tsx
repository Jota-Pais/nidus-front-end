import type { CSSProperties, ReactNode } from 'react'
import './estilos.css'

/**
 * `padrao` é o cartão de todo dia. `elevado` sobe no hover, para cartão
 * clicável. `destacado` recebe a borda de gradiente de 2px — é o "este aqui",
 * e vale um por tela.
 */
export type VarianteDeCartao = 'padrao' | 'elevado' | 'destacado'

/**
 * Superfície elevada.
 *
 * Branco puro sobre o off-white morno do fundo: é a diferença de 5% que faz o
 * cartão descolar da página sem precisar de borda pesada.
 *
 * A borda de gradiente do `destacado` é feita com dois elementos — o de fora
 * com 2px de padding e o gradiente, o de dentro branco. É a técnica do design
 * system, e existe porque `border-image` não acompanha `border-radius`.
 */
export function Cartao({
  children,
  variante = 'padrao',
  aoClicar,
  className,
  estilo,
}: {
  children: ReactNode
  variante?: VarianteDeCartao
  /** Passando isto o cartão vira `<button>`: foco, Enter e Espaço de graça. */
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
