import { DownOutlined, UpOutlined } from '@ant-design/icons'
import type { SortOrder } from 'antd/es/table/interface'
import './estilos.css'

/**
 * As setas de ordem no cabeçalho da coluna, no lugar das do Ant Design: empilhadas ao lado do
 * título, escondidas até o mouse passar por cima, e a seta da ordem atual na cor de ação.
 * Vai no `sortIcon` da coluna; o clique continua sendo o da tabela (crescente, decrescente,
 * sem ordem)
 */
export function SetasDeOrdem({ sortOrder }: { sortOrder: SortOrder }) {
  return (
    <span
      className={`setas-de-ordem${sortOrder ? ' setas-de-ordem--ordenando' : ''}`}
      aria-hidden="true"
    >
      <UpOutlined
        className={`setas-de-ordem__seta${sortOrder === 'ascend' ? ' setas-de-ordem__seta--ativa' : ''}`}
      />
      <DownOutlined
        className={`setas-de-ordem__seta${sortOrder === 'descend' ? ' setas-de-ordem__seta--ativa' : ''}`}
      />
    </span>
  )
}
