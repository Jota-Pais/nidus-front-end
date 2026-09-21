import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import type { ReactNode } from 'react'

export interface Aba {
  chave: string
  rotulo: ReactNode
  conteudo: ReactNode
  desabilitada?: boolean
}

/** Abas */
export function Abas({
  abas,
  chave,
  aoTrocar,
  ...props
}: Omit<TabsProps, 'items' | 'activeKey' | 'onChange'> & {
  abas: Aba[]
  chave?: string
  aoTrocar?: (chave: string) => void
}) {
  return (
    <Tabs
      {...(chave === undefined ? {} : { activeKey: chave })}
      {...(aoTrocar === undefined ? {} : { onChange: aoTrocar })}
      items={abas.map((aba) => ({
        key: aba.chave,
        label: aba.rotulo,
        children: aba.conteudo,
        ...(aba.desabilitada === undefined ? {} : { disabled: aba.desabilitada }),
      }))}
      {...props}
    />
  )
}
