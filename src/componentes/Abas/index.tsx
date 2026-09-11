import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import type { ReactNode } from 'react'

export interface Aba {
  chave: string
  rotulo: ReactNode
  conteudo: ReactNode
  desabilitada?: boolean
}

/**
 * Abas.
 *
 * ⚠️ **A aba ativa precisa caber na URL.** A ficha da posição tem ciclos,
 * eventos e dados da caixa; um técnico que quer mostrar o histórico para
 * outro manda o link, e um link que sempre abre na primeira aba obriga a
 * explicar "clica em Eventos". Por isso `chave` e `aoTrocar` são controlados
 * de fora, pela tela, que é quem tem acesso ao roteador.
 *
 * ⚠️ **Não esconda atrás de aba o que decide.** Numa tela de registro, aba é
 * onde a informação vai para morrer: o técnico não sabe que ela existe. Vale
 * para histórico e detalhe, não para campo obrigatório.
 */
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
