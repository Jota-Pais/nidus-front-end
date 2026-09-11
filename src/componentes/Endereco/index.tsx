import type { EnderecoNaFicha } from '@/dominio/ficha'
import './estilos.css'

const ROTULO_DA_FACE: Record<string, string> = {
  frontal: 'face frontal',
  traseira: 'face traseira',
}

/**
 * Onde a caixa está fisicamente — `RF-INF-02`.
 *
 * `E-03 · Sala 1 · A1`, com o código em destaque: é a etiqueta que o técnico
 * lê na estante real, e é por ela que ele acha a caixa andando pela sala.
 *
 * ⚠️ **A face faz parte do endereço, não é sufixo.** Uma estante tem duas
 * faces e a posição `A1` existe nas duas: mandar alguém em `E-03 A1` sem
 * dizer a face é mandar procurar em dois lugares. Por isso ela entra sempre
 * na leitura completa, e no modo `curto` — onde não cabe — vira `title`.
 */
export function Endereco({
  endereco,
  curto = false,
}: {
  endereco: EnderecoNaFicha
  /** Só `E-03 · A1`, para dentro de card. A leitura completa vira `title`. */
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
