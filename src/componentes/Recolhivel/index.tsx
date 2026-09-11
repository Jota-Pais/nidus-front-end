import { Collapse } from 'antd'
import type { ReactNode } from 'react'

export interface Painel {
  chave: string
  titulo: ReactNode
  conteudo: ReactNode
  extra?: ReactNode
}

/**
 * Blocos que abrem e fecham.
 *
 * Para o secundário de uma tela densa — a legenda de estados, os filtros
 * avançados, os ciclos antigos de um casal no quinto parto. O `RN-04`
 * permite cinco ciclos por casal, e mostrar os cinco abertos empurra o que
 * interessa (o ciclo atual) para fora da tela.
 *
 * ⚠️ **Nunca recolher o que precisa ser lido antes de agir.** Aviso de
 * compromisso afetado, campo obrigatório e erro ficam sempre à vista: o
 * usuário não abre o que não sabe que existe.
 */
export function Recolhivel({
  paineis,
  abertos,
  aoTrocar,
  comBorda = false,
}: {
  paineis: Painel[]
  /** Controlado pela tela quando o que está aberto precisa sobreviver a um F5. */
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
