import { Descriptions } from 'antd'
import type { ReactNode } from 'react'

export interface Definicao {
  rotulo: string
  valor: ReactNode
  /** Ocupa mais de uma coluna. Para texto longo — motivo, justificativa. */
  colunas?: number
}

/**
 * Par rótulo/valor — a espinha da ficha da posição (`RF-INF-04`).
 *
 * Recebe uma lista, não `Descriptions.Item` soltos, porque assim a ficha é um
 * array que se monta com `.filter(Boolean)`: campo que não se aplica àquela
 * caixa some da lista em vez de aparecer como "—" e ocupar espaço numa tela
 * que já é densa.
 *
 * Duas colunas no desktop, uma no celular: com três colunas o valor fica mais
 * estreito que o rótulo e a leitura vira um jogo de encaixe.
 */
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
