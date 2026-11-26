// A estante em miniatura, desenhada pelas medidas do formato: serve também para o formato que ainda
// não foi gravado. A MiniGrade do EscolherCaixa desenha a grade que a API manda, para clicar num
// lugar; esta desenha as medidas escolhidas no formulário, e não se clica
import { codigoDaPosicao, descreverMedidas, facesDa } from '@/dominio/formato'
import type { Medidas } from '@/dominio/formato'
import type { Face, Grade } from '@/dominio/tipos'
import './MiniaturaDaEstante.css'

const chaveDaPosicao = (face: Face, linha: number, coluna: number) => `${face}:${linha}:${coluna}`

/** De 1 até n */
const ate = (n: number) => Array.from({ length: n }, (_, indice) => indice + 1)

/**
 * As faces lado a lado, uma célula pequena por posição, com o código no título. Com a grade da
 * estante que já existe, a posição com caixa fica marcada; a caixa que as medidas deixam de fora
 * não aparece, e quem fala dela é o aviso do formulário
 */
export function MiniaturaDaEstante({
  medidas,
  grade,
}: {
  medidas: Medidas
  grade?: Grade | undefined
}) {
  const comCaixa = new Set(
    (grade?.faces ?? []).flatMap(({ face, posicoes }) =>
      posicoes
        .filter((posicao) => posicao.caixa !== null)
        .map((posicao) => chaveDaPosicao(face, posicao.linha, posicao.coluna)),
    ),
  )
  const faces = facesDa(medidas.faces).map((face) => ({
    face,
    posicoes: ate(medidas.linhas).flatMap((linha) =>
      ate(medidas.colunas).map((coluna) => ({
        codigo: codigoDaPosicao(face, linha, coluna, medidas.colunas),
        ocupada: comCaixa.has(chaveDaPosicao(face, linha, coluna)),
      })),
    ),
  }))
  const ocupadas = faces.flatMap(({ posicoes }) => posicoes).filter((p) => p.ocupada).length

  return (
    <div className="miniatura">
      <div
        className="miniatura__faces"
        role="img"
        aria-label={`A estante: ${descreverMedidas(medidas)}${ocupadas > 0 ? `, ${ocupadas} com caixa` : ''}`}
      >
        {faces.map(({ face, posicoes }) => (
          <div key={face} className="miniatura__face">
            <span className="miniatura__rotulo">{face === 'frontal' ? 'Frontal' : 'Traseira'}</span>
            <div
              className="miniatura__celulas"
              // a célula encolhe até 6 px quando as colunas não cabem na largura
              style={{ gridTemplateColumns: `repeat(${medidas.colunas}, minmax(6px, 14px))` }}
            >
              {posicoes.map(({ codigo, ocupada }) => (
                <span
                  key={codigo}
                  className={`miniatura__celula${ocupada ? ' miniatura__celula--ocupada' : ''}`}
                  title={ocupada ? `${codigo}: com caixa` : codigo}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {ocupadas > 0 && (
        <span className="miniatura__legenda">
          <span className="miniatura__celula miniatura__celula--ocupada" aria-hidden="true" />
          posição com caixa
        </span>
      )}
    </div>
  )
}
