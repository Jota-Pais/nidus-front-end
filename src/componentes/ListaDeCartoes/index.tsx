import type { Key, ReactNode } from 'react'
import { Vazio } from '../Vazio'
import './estilos.css'

/**
 * A lista do celular: um cartão por item, no lugar da tabela que rolaria de lado. Cada tela monta
 * o seu cartão com as peças abaixo: o topo (o nome e o que mais identifica o item), os dados
 * sob os seus rótulos, em duas colunas, e as ações em botões do tamanho do dedo
 */
export function ListaDeCartoes<T>({
  itens,
  chave,
  rotulo,
  vazio,
  renderizar,
}: {
  itens: readonly T[]
  chave: (item: T) => Key
  /** o nome da lista para o leitor de tela */
  rotulo: string
  /** o que aparece sem item nenhum */
  vazio: ReactNode
  renderizar: (item: T) => ReactNode
}) {
  if (itens.length === 0) return <Vazio descricao={vazio} />

  return (
    <ul className="cartoes" aria-label={rotulo}>
      {itens.map((item) => (
        <li key={chave(item)} className="cartoes__item">
          {renderizar(item)}
        </li>
      ))}
    </ul>
  )
}

/** O topo do cartão: o nome à esquerda e, à direita, uma etiqueta ou um número */
function Topo({ children, lado }: { children: ReactNode; lado?: ReactNode }) {
  return (
    <div className="cartoes__topo">
      <div className="cartoes__titulo">{children}</div>
      {lado !== undefined && <div className="cartoes__lado">{lado}</div>}
    </div>
  )
}

/** Os dados do item, cada um sob o seu rótulo, dois por linha */
function Dados({ children }: { children: ReactNode }) {
  return <dl className="cartoes__dados">{children}</dl>
}

/** Um dado: o rótulo pequeno em cima e o valor embaixo. 'largo' ocupa a linha inteira */
function Dado({
  rotulo,
  largo = false,
  children,
}: {
  rotulo: string
  largo?: boolean
  children: ReactNode
}) {
  return (
    <div className={largo ? 'cartoes__dado cartoes__dado--largo' : 'cartoes__dado'}>
      <dt>{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** As ações do item, embaixo, dividindo a largura */
function Acoes({ children }: { children: ReactNode }) {
  return <div className="cartoes__acoes">{children}</div>
}

ListaDeCartoes.Topo = Topo
ListaDeCartoes.Dados = Dados
ListaDeCartoes.Dado = Dado
ListaDeCartoes.Acoes = Acoes
