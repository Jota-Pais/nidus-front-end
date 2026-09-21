import './estilos.css'

/** ponto que pulsa - o indicador de "isto está vivo" */
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
