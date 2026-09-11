import { Tooltip } from 'antd'
import './estilos.css'

/**
 * Em que ciclo o casal está — `RF-CIC-04`.
 *
 * "O ciclo (1º a 5º) muda a leitura de risco da oferta e precisa estar
 * visível, com legenda e não só cor." Um casal no 5º ciclo é o último parto
 * daquele casal (`RN-04`): a oferta que depende dele não se repete, e quem
 * planeja o atendimento precisa enxergar isso no card, não abrindo a ficha.
 *
 * ⚠️ **Três canais, nenhum só de cor** (`RNF-10`):
 *
 * - **número** — `3/5`, que é o que se lê;
 * - **forma** — a fileira de marcas preenchidas, que dá a proporção de
 *   relance e sobrevive à impressão em preto e branco;
 * - **texto** — o `title` diz "3º ciclo de até 5" e avisa quando é o último.
 *
 * O máximo vem do casal, não de constante: o `RN-01` deixa os parâmetros
 * biológicos configuráveis por espécie, com histórico (`RNF-05`).
 */
export function IndicadorDeCiclo({
  atual,
  maximo,
  compacto = false,
}: {
  atual: number
  maximo: number
  /** Só o número, sem a fileira. Para dentro de card pequeno. */
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
