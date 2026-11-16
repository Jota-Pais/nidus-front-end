// tradução de erro da API para mensagem de tela.

/**
 * Os códigos que a API manda no envelope de erro. Todo 409 é regra de negócio e já vem com a
 * mensagem em português: a tela só olha o código quando age diferente por ele (o pedido que a
 * baixa precisa indicar, o código de acesso inválido)
 */
export type CodigoDeErro =
  // 400, 401, 403, 404, 413, 429 e 500
  | 'VALIDACAO'
  | 'NAO_AUTENTICADO'
  | 'SEM_PERMISSAO'
  | 'NAO_ENCONTRADO'
  | 'MUITAS_TENTATIVAS'
  | 'ERRO_INTERNO'
  // a ordem do ciclo: parto, desmame, pedido no status errado, filhote que ainda mama
  | 'SEQUENCIA_INVALIDA'
  | 'LIMITE_PARTOS_ATINGIDO'
  | 'DATA_FORA_DA_ORDEM'
  // caixas e estantes
  | 'CAIXA_LIBERADA'
  | 'CAIXA_COM_ANIMAIS'
  | 'CAIXA_DE_ESTOQUE'
  | 'CAIXA_JA_TEM_CASAL_ATIVO'
  | 'POSICAO_OCUPADA'
  | 'TOPOLOGIA'
  // os animais: a baixa, a mudança e a reserva acharam menos vivos; o pedido dos reservados
  | 'SEM_ANIMAIS'
  | 'PEDIDO_NAO_INDICADO'
  | 'ANIMAL_ORIGEM'
  | 'ANIMAL_SITUACAO'
  | 'ANIMAL_CAIXA'
  | 'OCORRENCIA_JA_ANULADA'
  // o pedido: reserva e entrega
  | 'PEDIDO_JA_RESERVADO'
  | 'PEDIDO_INCOMPLETO'
  | 'PEDIDO_EXCEDIDO'
  | 'PEDIDO_RESERVA'
  | 'PEDIDO_COM_RESERVA'
  | 'PEDIDO_ENTREGUE'
  | 'IDADE_FORA_DA_FAIXA'
  | 'NAO_DESMAMADO'
  // cadastros e contas
  | 'ESTANTE_DUPLICADA'
  | 'ESTANTE_OCUPADA'
  | 'SALA_DUPLICADA'
  | 'SALA_COM_ESTANTE'
  | 'LINHAGEM_DUPLICADA'
  | 'PROJETO_DUPLICADO'
  | 'EMAIL_EM_USO'
  | 'ALTERACAO_PROPRIA'
  | 'CONTA_INATIVA'
  | 'CODIGO_INVALIDO'

interface ErroApi {
  codigo: CodigoDeErro
  /** Já vem em português, pronta para exibir */
  mensagem: string
  /** Só em erro de validação, ou quando o erro aponta para campo específico. */
  campos?: Record<string, string>
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

/** Credencial inválida tem mensagem única, por segurança. Quem usa é o login (useLogin) */
export const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos.'

/** 401 fora do login: a sessão acabou no meio do uso */
export const SESSAO_EXPIRADA = 'Sua sessão expirou. Entre de novo.'

/** mensagem a exibir para o usuário, dado o status HTTP e o corpo da resposta. */
export function mensagemDeErro(status: number, corpo: unknown): string {
  if (status === 401) return SESSAO_EXPIRADA
  if (!ehRespostaDeErro(corpo)) return MENSAGEM_GENERICA
  if (status >= 500) return MENSAGEM_GENERICA
  return corpo.erro.mensagem
}

/** Erros por campo, para o formulário marcar o campo certo. Vazio quando não houver */
export function camposDeErro(corpo: unknown): Record<string, string> {
  return ehRespostaDeErro(corpo) ? (corpo.erro.campos ?? {}) : {}
}
