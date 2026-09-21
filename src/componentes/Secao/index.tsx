import type { ReactNode } from 'react'
import { Cartao } from '../Cartao'
import type { VarianteDeCartao } from '../Cartao'
import { RotuloDeSecao } from '../RotuloDeSecao'
import './estilos.css'

/** bloco de conteúdo da tela: um 'Cartao' com cabeçalho. */
export function Secao({
  titulo,
  rotulo,
  acoes,
  children,
  variante = 'padrao',
  semPreenchimento = false,
}: {
  titulo?: ReactNode
  rotulo?: string
  acoes?: ReactNode
  children: ReactNode
  variante?: VarianteDeCartao
  /** Para conteúdo que desenha o próprio respiro - tabela, grade de estante. */
  semPreenchimento?: boolean
}) {
  const temCabecalho = titulo !== undefined || rotulo !== undefined || acoes !== undefined

  return (
    <Cartao variante={variante} className={semPreenchimento ? 'secao--rente' : ''}>
      {temCabecalho && (
        <header className="secao__cabecalho">
          <div className="secao__identificacao">
            {rotulo && <RotuloDeSecao>{rotulo}</RotuloDeSecao>}
            {titulo && <h3 className="secao__titulo">{titulo}</h3>}
          </div>
          {acoes && <div className="secao__acoes">{acoes}</div>}
        </header>
      )}
      {children}
    </Cartao>
  )
}
