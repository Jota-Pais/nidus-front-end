import { Descriptions } from 'antd'
import type { ReactNode } from 'react'

export interface Definicao {
  rotulo: string
  valor: ReactNode
  /** ocupa mais de uma coluna. Para texto longo - motivo, justificativa */
  colunas?: number
}

/** par rótulo/valor - a espinha da ficha da posição (RF-INF-04). */
export function ListaDeDefinicoes({
  itens,
  titulo,
  colunas,
}: {
  itens: Definicao[]
  titulo?: ReactNode
  colunas?: number
}) {
  return (
    <Descriptions
      size="small"
      bordered
      column={colunas ?? { xs: 1, sm: 1, md: 2 }}
      {...(titulo === undefined ? {} : { title: titulo })}
      items={itens.map((item, indice) => ({
        key: `${item.rotulo}-${indice}`,
        label: item.rotulo,
        children: item.valor,
        ...(item.colunas === undefined ? {} : { span: item.colunas }),
      }))}
    />
  )
}
