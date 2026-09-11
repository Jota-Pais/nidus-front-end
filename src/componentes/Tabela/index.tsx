import { Table } from 'antd'
import type { TablePaginationConfig, TableProps } from 'antd'

/**
 * Tabela com os padrões da aplicação.
 *
 * O que resolve de uma vez, e que se perde quando alguém usa o `Table` cru:
 *
 * - **`scroll={{ x: 'max-content' }}`** — sem isso a tabela quebra o layout no
 *   tablet em vez de rolar dentro de si mesma (`RNF-03`).
 * - **Contagem em português no rodapé.** O padrão do Ant Design é
 *   `1-10 of 34`, e metade das telas acabaria com uma tradução diferente.
 * - **`rowKey` obrigatório e tipado.** `rowKey` esquecido é o bug de React que
 *   mais custa a achar: a linha muda de conteúdo e não de identidade, e o
 *   estado de seleção gruda na linha errada.
 */
export function Tabela<T extends object>({
  rowKey,
  pagination,
  ...resto
}: TableProps<T> & { rowKey: NonNullable<TableProps<T>['rowKey']> }) {
  const paginacao: false | TablePaginationConfig =
    pagination === false
      ? false
      : {
          showSizeChanger: true,
          showTotal: (total, [de, ate]) => `${de}–${ate} de ${total}`,
          ...pagination,
        }

  return (
    <Table<T>
      size="middle"
      rowKey={rowKey}
      scroll={{ x: 'max-content' }}
      pagination={paginacao}
      {...resto}
    />
  )
}
