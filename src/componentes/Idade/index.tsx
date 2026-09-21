import { Tooltip } from 'antd'
import './estilos.css'

/** Idade em dias inteiros */
export function Idade({
  dias,
  base,
}: {
  dias: number | null | undefined
  /** De onde se conta. Enquanto CONF-01 não fecha, deve ser sempre dito. */
  base?: 'nascimento' | 'desmame'
}) {
  if (dias === null || dias === undefined) {
    return <span className="idade idade--ausente">—</span>
  }

  const texto = `${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const conteudo = <span className="idade">{texto}</span>

  if (!base) return conteudo

  return (
    <Tooltip title={`${texto} contados a partir do ${base}.`}>
      <span className="idade idade--comBase">{texto}</span>
    </Tooltip>
  )
}
