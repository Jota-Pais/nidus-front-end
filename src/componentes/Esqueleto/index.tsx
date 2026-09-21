import { Skeleton } from 'antd'

/** Espera com a forma do que vem. */
export function Esqueleto({
  linhas = 3,
  comTitulo = false,
}: {
  linhas?: number
  comTitulo?: boolean
}) {
  return <Skeleton active paragraph={{ rows: linhas }} title={comTitulo} />
}
