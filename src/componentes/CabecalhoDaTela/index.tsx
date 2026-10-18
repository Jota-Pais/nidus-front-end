import type { ReactNode } from 'react'
import { RotuloDeSecao } from '../RotuloDeSecao'
import './estilos.css'

/** Cabeçalho de tela: rótulo, título, uma linha de contexto e as ações */
export function CabecalhoDaTela({
  titulo,
  rotulo,
  descricao,
  acoes,
}: {
  titulo: string
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

        <h1 className="cabecalhoDaTela__titulo">{titulo}</h1>

        {descricao && <p className="cabecalhoDaTela__descricao">{descricao}</p>}
      </div>

      {acoes && <div className="cabecalhoDaTela__acoes">{acoes}</div>}
    </header>
  )
}
