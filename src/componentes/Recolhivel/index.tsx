import { Collapse } from 'antd'
import type { ReactNode } from 'react'

export interface Painel {
  chave: string
  titulo: ReactNode
  conteudo: ReactNode
  extra?: ReactNode
}

/** blocos que abrem e fecham */
export function Recolhivel({
  paineis,
  abertos,
  aoTrocar,
  comBorda = false,
}: {
  paineis: Painel[]
  /** Controlado pela tela quando o que está aberto precisa sobreviver a um F5 */
  abertos?: string[]
  aoTrocar?: (abertos: string[]) => void
  comBorda?: boolean
}) {
  return (
    <Collapse
      bordered={comBorda}
      ghost={!comBorda}
      {...(abertos === undefined ? {} : { activeKey: abertos })}
      {...(aoTrocar === undefined
        ? {}
        : { onChange: (chaves: string | string[]) => aoTrocar([chaves].flat()) })}
      items={paineis.map((painel) => ({
        key: painel.chave,
        label: painel.titulo,
        children: painel.conteudo,
        ...(painel.extra === undefined ? {} : { extra: painel.extra }),
      }))}
    />
  )
}
