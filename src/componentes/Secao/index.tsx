import type { ReactNode } from 'react'
import './estilos.css'

/** bloco de conteúdo da tela: uma superfície elevada com cabeçalho. */
export function Secao({
  titulo,
  acoes,
  children,
  semPreenchimento = false,
}: {
  titulo?: ReactNode
  acoes?: ReactNode
  children: ReactNode
  /** Para conteúdo que desenha o próprio respiro - tabela, grade de estante. */
  semPreenchimento?: boolean
}) {
  const temCabecalho = titulo !== undefined || acoes !== undefined

  return (
    <div className={`secao${semPreenchimento ? ' secao--rente' : ''}`}>
      {temCabecalho && (
        <header className="secao__cabecalho">
          <div className="secao__identificacao">
            {titulo && <h3 className="secao__titulo">{titulo}</h3>}
          </div>
          {acoes && <div className="secao__acoes">{acoes}</div>}
        </header>
      )}
      {children}
    </div>
  )
}
