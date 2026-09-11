import { WarningFilled } from '@ant-design/icons'
import './estilos.css'

/**
 * Previsão vencida sem confirmação — o alerta mais importante do `RF-REP-07`.
 *
 * O contrato descreve o problema com estas palavras: **erosão silenciosa da
 * confiabilidade dos dados**. Uma data de parto que passou e ninguém
 * confirmou não é um atraso de uma caixa — é o sistema inteiro perdendo o
 * direito de ser acreditado, porque a partir dali toda projeção que depende
 * daquela cadeia está errada e ninguém sabe.
 *
 * Por isso este é o único componente do projeto que tem permissão de gritar.
 *
 * ⚠️ **Quatro canais** (`RNF-10`): ícone (forma), palavra (texto), cor e —
 * onde ele é aplicado, no card — borda grossa. Nenhum sozinho.
 */
export function MarcaDeAtraso({
  desde,
  compacta = false,
}: {
  /** Dias vencidos, se o servidor informar. Não é calculado aqui (`RNF-01`). */
  desde?: number
  /** Só o ícone, para o canto do card. O texto vira `title`. */
  compacta?: boolean
}) {
  const texto =
    desde === undefined
      ? 'Vencido sem confirmação'
      : `Vencido há ${desde} ${desde === 1 ? 'dia' : 'dias'} sem confirmação`

  return (
    <span
      className={`marcaDeAtraso${compacta ? ' marcaDeAtraso--compacta' : ''}`}
      title={texto}
      aria-label={texto}
      role="status"
    >
      <WarningFilled aria-hidden="true" />
      {!compacta && <span className="marcaDeAtraso__texto">{texto}</span>}
    </span>
  )
}
