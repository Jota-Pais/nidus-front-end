import { Tooltip } from 'antd'
import './estilos.css'

/** Em que ciclo o casal está - RF-CIC-04 */
export function IndicadorDeCiclo({
  atual,
  maximo,
  compacto = false,
}: {
  atual: number
  maximo: number
  /** Só o número, sem a fileira. Para dentro de card pequeno */
  compacto?: boolean
}) {
  const ultimo = atual >= maximo
  const explicacao = ultimo
    ? `${atual}º ciclo de até ${maximo} — é o último deste casal.`
    : `${atual}º ciclo de até ${maximo}.`

  return (
    <Tooltip title={explicacao}>
      <span
        className={`ciclo${ultimo ? ' ciclo--ultimo' : ''}`}
        aria-label={explicacao}
      >
        <span className="ciclo__numero">
          {atual}/{maximo}
        </span>

        {!compacto && (
          <span className="ciclo__fileira" aria-hidden="true">
            {Array.from({ length: maximo }, (_, indice) => (
              <span
                key={indice}
                className={`ciclo__marca${indice < atual ? ' ciclo__marca--cheia' : ''}`}
              />
            ))}
          </span>
        )}
      </span>
    </Tooltip>
  )
}
