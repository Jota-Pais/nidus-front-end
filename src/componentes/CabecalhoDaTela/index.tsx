import type { ReactNode } from 'react'
import { RotuloDeSecao } from '../RotuloDeSecao'
import { TextoGradiente } from '../TextoGradiente'
import './estilos.css'

/** Cabeçalho de tela: rótulo, título, uma linha de contexto e as ações */
export function CabecalhoDaTela({
  titulo,
  realce,
  rotulo,
  descricao,
  acoes,
}: {
  titulo: string
  /** palavra final destacada com o gradiente. ex: título "Grade de", realce "estantes" */
  realce?: string
  /** A pílula monoespaçada acima do título. ex: "Infraestrutura" */
  rotulo?: string
  /** uma linha. O que a tela faz, ou como se usa */
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
