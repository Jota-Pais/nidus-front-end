import type { ReactNode } from 'react'
import { RotuloDeSecao } from '../RotuloDeSecao'
import { TextoGradiente } from '../TextoGradiente'
import './estilos.css'

/**
 * Cabeçalho de tela: rótulo, título, uma linha de contexto e as ações.
 *
 * O título sai em `Calistoga` — a voz da personalidade do design system. O
 * `realce` pinta **a última palavra** com o gradiente-assinatura, que é o
 * padrão descrito: uma âncora por título, nunca a frase inteira.
 *
 * ⚠️ **Nada de ID de requisito aqui.** Quem lê esta tela é o técnico de luvas,
 * não o professor: `RF-INF-03` na tela é ruído. O requisito mora no JSDoc da
 * tela e no card do Trello — o stub `EmConstrucao` é que os mostra, e ele
 * existe justamente para sumir.
 */
export function CabecalhoDaTela({
  titulo,
  realce,
  rotulo,
  descricao,
  acoes,
}: {
  titulo: string
  /** Palavra final destacada com o gradiente. Ex.: título "Grade de", realce "estantes". */
  realce?: string
  /** A pílula monoespaçada acima do título. Ex.: "Infraestrutura". */
  rotulo?: string
  /** Uma linha. O que a tela faz, ou como se usa. Não é parágrafo de ajuda. */
  descricao?: ReactNode
  acoes?: ReactNode
}) {
  return (
    <header className="cabecalhoDaTela">
      <div className="cabecalhoDaTela__identificacao">
        {rotulo && <RotuloDeSecao>{rotulo}</RotuloDeSecao>}

        <h1 className="cabecalhoDaTela__titulo">
          {titulo}
          {realce && (
            <>
              {' '}
              <TextoGradiente>{realce}</TextoGradiente>
            </>
          )}
        </h1>

        {descricao && <p className="cabecalhoDaTela__descricao">{descricao}</p>}
      </div>

      {acoes && <div className="cabecalhoDaTela__acoes">{acoes}</div>}
    </header>
  )
}
