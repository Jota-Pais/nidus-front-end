import { Table } from 'antd'
import type { TablePaginationConfig, TableProps } from 'antd'

/** Tabela com os padrões da aplicação. */
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
