import { Alert } from 'antd'
import { ErroDeApi, ErroDeRede } from '@/lib/api'

/**
 * Erro de mutação, na tela, do jeito certo para cada caso.
 *
 * Nenhuma tela escreve o seu `<Alert type="error">`: a resposta certa depende
 * do status e é sempre a mesma.
 *
 * - **409 é regra de negócio** (`contrato-api.md` §2.1), não falha. Vermelho
 *   diz "o sistema quebrou"; o que aconteceu foi o sistema funcionar e recusar.
 *   Sai como aviso.
 * - **`ErroDeRede`** é a API dormindo na Render, não erro do usuário.
 * - **401** manda para o login — quem trata é a rota, aqui só não se mostra
 *   pilha de erro para quem só precisa entrar de novo.
 *
 * `role="alert"` em todos: o `RNF-10` pede que o leitor de tela anuncie o erro
 * assim que ele aparece, sem o usuário ter que sair procurando.
 *
 * Devolve `null` sem erro, então dá para deixar montado sem `&&` na tela.
 */
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
