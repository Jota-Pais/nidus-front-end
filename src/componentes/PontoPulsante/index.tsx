import './estilos.css'

/**
 * Ponto que pulsa — o indicador de "isto está vivo".
 *
 * Usado no rótulo de seção e ao lado de contagem que muda sozinha: alerta do
 * ciclo, solicitação nova, caixa com previsão vencida.
 *
 * ⚠️ **Não usar como único sinal.** O pulso morre em `prefers-reduced-motion`
 * e não existe para leitor de tela. Quem depende dele para saber que algo está
 * atrasado não vai saber — é reforço de um dado que já está escrito ao lado.
 */
export function PontoPulsante({
  cor = 'acento',
  pulsando = true,
}: {
  cor?: 'acento' | 'aviso' | 'erro' | 'sucesso'
  pulsando?: boolean
}) {
  return (
    <span
      className={`pontoPulsante pontoPulsante--${cor}${pulsando ? ' pontoPulsante--ativo' : ''}`}
      aria-hidden="true"
    />
  )
}
