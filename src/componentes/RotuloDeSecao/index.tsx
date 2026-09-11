import type { ReactNode } from 'react'
import { PontoPulsante } from '../PontoPulsante'
import './estilos.css'

/**
 * A pílula que abre cada seção — assinatura do design system.
 *
 * Monoespaçada, caixa alta, espaçamento largo entre letras, com um ponto de
 * acento à esquerda. Faz duas coisas ao mesmo tempo: cria o ritmo visual que
 * orienta quem rola a página, e dá à seção um ar de peça de interface
 * desenhada em vez de título solto.
 *
 * ⚠️ O ponto pulsa **só quando há algo vivo** — alerta aberto, solicitação
 * nova. Pulso permanente é ruído: em uma semana o usuário para de ver.
 */
export function RotuloDeSecao({
  children,
  cor = 'acento',
  pulsando = false,
}: {
  children: ReactNode
  cor?: 'acento' | 'aviso' | 'erro' | 'sucesso'
  pulsando?: boolean
}) {
  return (
    <span className={`rotuloDeSecao rotuloDeSecao--${cor}`}>
      <PontoPulsante cor={cor} pulsando={pulsando} />
      <span className="rotuloDeSecao__texto">{children}</span>
    </span>
  )
}
