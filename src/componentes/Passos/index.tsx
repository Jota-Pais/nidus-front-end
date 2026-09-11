import { Steps } from 'antd'
import type { ReactNode } from 'react'

export interface Passo {
  titulo: string
  descricao?: ReactNode
}

/**
 * Onde a coisa está num caminho de várias etapas.
 *
 * Serve à solicitação (`RF-DEM-05`: o pesquisador acompanha em que ponto o
 * pedido está) e ao ciclo reprodutivo — acasalamento, parto, seleção,
 * desmame — que é uma cadeia temporal de verdade (`RN-05`), não uma metáfora.
 *
 * ⚠️ **Só mostra; não navega.** O estado da solicitação é do servidor
 * (`RNF-01`) e clicar num passo não pode mudá-lo. Voltar uma etapa é um
 * registro novo, com autor e data (`RNF-06`), e isso é botão explícito — não
 * um clique num diagrama.
 *
 * ⚠️ Passo com problema usa `comFalha`, que o Ant Design marca com ícone e
 * cor: dois canais, como o `RNF-10` pede.
 */
export function Passos({
  passos,
  atual,
  comFalha = false,
  vertical = false,
}: {
  passos: Passo[]
  /** Índice do passo em andamento, base zero. */
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
