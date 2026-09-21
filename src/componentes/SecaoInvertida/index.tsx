import type { ReactNode } from 'react'
import './estilos.css'

/** Faixa invertida: fundo slate escuro, texto claro, malha de pontos. */
export function SecaoInvertida({
  children,
  comBrilho = true,
}: {
  children: ReactNode
  /** brilho radial de acento no canto. Desligar quando houver outro ao lado */
  comBrilho?: boolean
}) {
  return (
    <section
      className={`secaoInvertida padraoDePontos${comBrilho ? ' brilhoDeAcento' : ''}`}
    >
      <div className="secaoInvertida__conteudo">{children}</div>
    </section>
  )
}
