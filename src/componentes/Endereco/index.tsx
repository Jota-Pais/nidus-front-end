import type { EnderecoNaFicha } from '@/dominio/ficha'
import './estilos.css'

const ROTULO_DA_FACE: Record<string, string> = {
  frontal: 'face frontal',
  traseira: 'face traseira',
}

/** onde a caixa está fisicamente - RF-INF-02 */
export function Endereco({
  endereco,
  curto = false,
}: {
  endereco: EnderecoNaFicha
  /** Só 'E-03 · A1', para dentro de card. A leitura completa vira title */
  curto?: boolean
}) {
  const face = ROTULO_DA_FACE[endereco.face] ?? endereco.face
  const completo = `${endereco.numeroVisivel} · ${endereco.sala} · ${face} · posição ${endereco.codigo}`

  return (
    <span className="endereco" title={completo} aria-label={completo}>
      <span className="endereco__estante">{endereco.numeroVisivel}</span>
      {!curto && (
        <>
          <span className="endereco__separador" aria-hidden="true">
            ·
          </span>
          <span className="endereco__sala">{endereco.sala}</span>
          <span className="endereco__separador" aria-hidden="true">
            ·
          </span>
          <span className="endereco__face">{face}</span>
        </>
      )}
      <span className="endereco__separador" aria-hidden="true">
        ·
      </span>
      <span className="endereco__codigo">{endereco.codigo}</span>
    </span>
  )
}
