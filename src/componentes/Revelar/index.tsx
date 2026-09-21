import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './estilos.css'

/** Entrada suave: o conteúdo sobe 28px e aparece quando entra na tela */
export function Revelar({
  children,
  atraso = 0,
}: {
  children: ReactNode
  /** Milissegundos. Para escalonar lista: 'indice * 100'. */
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
      // 15% evita animar o que só encostou na borda da tela
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
