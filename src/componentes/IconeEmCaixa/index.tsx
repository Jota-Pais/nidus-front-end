import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Ícone dentro de um quadrado de gradiente.
 *
 * O design system é explícito neste ponto: ícone de destaque leva **fundo de
 * gradiente cheio**, não preenchimento translúcido. É o que mantém o acento
 * concentrado e evita a papa de azuis desbotados que aparece quando cada
 * ícone recebe 10% de opacidade.
 *
 * `neutro` é a versão sem acento, para ícone que só acompanha um rótulo — se
 * todo ícone da tela for gradiente, nenhum se destaca.
 */
export function IconeEmCaixa({
  children,
  tamanho = 'md',
  neutro = false,
}: {
  children: ReactNode
  tamanho?: 'sm' | 'md' | 'lg'
  neutro?: boolean
}) {
  return (
    <span
      className={`iconeEmCaixa iconeEmCaixa--${tamanho}${neutro ? ' iconeEmCaixa--neutro' : ''}`}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}
