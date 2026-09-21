import { Steps } from 'antd'
import type { ReactNode } from 'react'

export interface Passo {
  titulo: string
  descricao?: ReactNode
}

/** Onde a coisa está num caminho de várias etapas */
export function Passos({
  passos,
  atual,
  comFalha = false,
  vertical = false,
}: {
  passos: Passo[]
  /** índice do passo em andamento, base zero. */
  atual: number
  comFalha?: boolean
  vertical?: boolean
}) {
  return (
    <Steps
      current={atual}
      status={comFalha ? 'error' : 'process'}
      direction={vertical ? 'vertical' : 'horizontal'}
      responsive
      items={passos.map((passo) => ({
        title: passo.titulo,
        ...(passo.descricao === undefined ? {} : { description: passo.descricao }),
      }))}
    />
  )
}
