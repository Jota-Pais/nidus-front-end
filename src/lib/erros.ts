// tradução de erro da API para mensagem de tela.

interface ErroApi {
  codigo: string
  /** Já vem em português, pronta para exibir */
  mensagem: string
}

interface RespostaDeErro {
  erro: ErroApi
}

/** descarta corpo que não segue a forma do contrato - resposta de proxy, HTML de gateway. */
export function ehRespostaDeErro(corpo: unknown): corpo is RespostaDeErro {
  if (typeof corpo !== 'object' || corpo === null || !('erro' in corpo)) return false
  const erro = (corpo as { erro: unknown }).erro
  return (
    typeof erro === 'object' &&
    erro !== null &&
    typeof (erro as ErroApi).codigo === 'string' &&
    typeof (erro as ErroApi).mensagem === 'string'
  )
}

const MENSAGEM_GENERICA = 'Não foi possível concluir. Tente de novo em alguns instantes.'

/** Credencial inválida tem mensagem única, por segurança */
export const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos.'

/** mensagem a exibir para o usuário, dado o status HTTP e o corpo da resposta. */
export function mensagemDeErro(status: number, corpo: unknown): string {
  if (status === 401) return CREDENCIAL_INVALIDA
  if (!ehRespostaDeErro(corpo)) return MENSAGEM_GENERICA
  if (status >= 500) return MENSAGEM_GENERICA
  return corpo.erro.mensagem
}
