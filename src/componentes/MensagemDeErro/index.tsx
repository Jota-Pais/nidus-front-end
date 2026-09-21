import { Alert } from 'antd'
import { ErroDeApi, ErroDeRede } from '@/lib/api'

/** erro de mutação, na tela, do jeito certo para cada caso */
export function MensagemDeErro({ erro, titulo }: { erro: unknown; titulo?: string }) {
  if (!erro) return null

  if (erro instanceof ErroDeApi && erro.ehRegraDeNegocio) {
    return (
      <Alert
        type="warning"
        showIcon
        role="alert"
        message={titulo ?? 'Não foi possível concluir'}
        description={erro.message}
      />
    )
  }

  if (erro instanceof ErroDeRede) {
    return (
      <Alert
        type="warning"
        showIcon
        role="alert"
        message="Servidor indisponível"
        description={erro.message}
      />
    )
  }

  const mensagem = erro instanceof Error ? erro.message : String(erro)

  return (
    <Alert
      type="error"
      showIcon
      role="alert"
      {...(titulo ? { message: titulo, description: mensagem } : { message: mensagem })}
    />
  )
}
