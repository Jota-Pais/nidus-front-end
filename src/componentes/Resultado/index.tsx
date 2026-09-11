import { Result } from 'antd'
import type { ResultProps } from 'antd'
import type { ReactNode } from 'react'

/** O que a tela inteira virou: sem permissão, não encontrado, erro ou sucesso. */
export type TipoDeResultado = 'semPermissao' | 'naoEncontrado' | 'erro' | 'sucesso'

const STATUS_ANT: Record<TipoDeResultado, ResultProps['status']> = {
  semPermissao: '403',
  naoEncontrado: '404',
  erro: 'error',
  sucesso: 'success',
}

/**
 * Estado de tela inteira.
 *
 * ⚠️ **`semPermissao` não é falha, e é o caso que mais aparece.** O
 * `RF-ACS-02` manda a autorização ser decidida no servidor: o pesquisador que
 * abre um link de estante recebe 403 porque **não enxerga a colônia**, e isso
 * é o sistema funcionando. Tratar como erro faria o usuário abrir chamado
 * para uma tela que está certa.
 *
 * Para erro de uma consulta dentro de uma tela que continua útil, use
 * `MensagemDeErro` — este componente toma a tela toda.
 */
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
