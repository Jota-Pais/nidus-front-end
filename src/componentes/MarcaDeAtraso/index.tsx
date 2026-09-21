import { WarningFilled } from '@ant-design/icons'
import './estilos.css'

/** Previsão vencida sem confirmação - o alerta mais importante do RF-REP-07 */
export function MarcaDeAtraso({
  desde,
  compacta = false,
}: {
  /** dias vencidos, se o servidor informar. Não é calculado aqui (RNF-01) */
  desde?: number
  /** Só o ícone, para o canto do card. O texto vira title */
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
