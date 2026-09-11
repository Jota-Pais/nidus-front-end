import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Entrada suave: o conteúdo sobe 28px e aparece quando entra na tela.
 *
 * O design system descreve isto em Framer Motion. Aqui é `IntersectionObserver`
 * mais uma animação de CSS, e não é economia de esforço — é uma dependência a
 * menos num projeto de semestre, e a decisão de stack está fechada
 * (`docs/decisoes-de-stack.md`): entrar com biblioteca de animação é conversa
 * com a equipe, não escolha de quem está escrevendo a tela.
 *
 * `atraso` escalona a entrada de uma lista: `atraso={indice * 100}`.
 *
 * ⚠️ **Três coisas que não podem quebrar, e por isso estão aqui e não solta
 * em cada tela:**
 *
 * 1. **Sem `IntersectionObserver`, o conteúdo aparece.** Um efeito de entrada
 *    que falha e deixa a tela em branco é pior que não ter efeito nenhum.
 * 2. **`prefers-reduced-motion` desliga.** Movimento em tela aberta o turno
 *    inteiro é gatilho de enjoo para quem tem sensibilidade vestibular.
 * 3. **Revela uma vez.** Reanimar a cada rolagem transforma a tela num
 *    piscador.
 *
 * ⚠️ **Não envolver conteúdo que muda de estado sozinho** — contador de
 * alerta, lista que chega por `invalidateQueries`. O dado novo entraria
 * animando e o técnico leria número em movimento.
 */
export function Revelar({
  children,
  atraso = 0,
}: {
  children: ReactNode
  /** Milissegundos. Para escalonar lista: `indice * 100`. */
  atraso?: number
}) {
  const alvo = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const elemento = alvo.current
    const semObservador = typeof IntersectionObserver === 'undefined'
    const movimentoReduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (!elemento || semObservador || movimentoReduzido) {
      setVisivel(true)
      return
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      // A margem negativa segura o disparo até o bloco entrar de verdade;
      // 15% evita animar o que só encostou na borda da tela.
      { threshold: 0.15, rootMargin: '-60px' },
    )

    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={alvo}
      className={`revelar${visivel ? ' revelar--visivel' : ''}`}
      style={atraso ? { animationDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </div>
  )
}
