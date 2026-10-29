import { Result } from 'antd'
import type { ResultProps } from 'antd'
import type { ReactNode } from 'react'

/** O que a tela inteira virou: sem permissão, não encontrado ou erro. */
type TipoDeResultado = 'semPermissao' | 'naoEncontrado' | 'erro'

const STATUS_ANT: Record<TipoDeResultado, ResultProps['status']> = {
  semPermissao: '403',
  naoEncontrado: '404',
  erro: 'error',
}

/** estado de tela inteira */
export function Resultado({
  tipo,
  titulo,
  detalhe,
  acao,
}: {
  tipo: TipoDeResultado
  titulo: string
  detalhe?: ReactNode
  acao?: ReactNode
}) {
  return (
    <Result
      status={STATUS_ANT[tipo] ?? 'info'}
      title={titulo}
      {...(detalhe === undefined ? {} : { subTitle: detalhe })}
      {...(acao === undefined ? {} : { extra: acao })}
    />
  )
}
