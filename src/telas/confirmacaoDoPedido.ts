import type { Viabilidade } from '@/dominio/tipos'

export interface Confirmacao {
  tom: 'sucesso' | 'erro' | 'atencao'
  titulo: string
  detalhe?: string
  enviar: string
  voltar: string
}

/** Quando a API não diz o motivo, o aviso ainda precisa dizer alguma coisa */
const NAO_DA = 'O CPMR provavelmente não consegue atender esse pedido.'

/**
 * O que o modal diz antes de enviar. Quem pede só quer saber se dá ou não dá: quando dá, sem
 * números; quando não dá, o motivo em vermelho, e o envio continua possível. Sem a conferência
 * (rede, API dormindo), o pedido também não trava: a equipe técnica confere ao analisar
 */
export function confirmacaoDoPedido(viabilidade: Viabilidade | null): Confirmacao {
  if (viabilidade === null) {
    return {
      tom: 'atencao',
      titulo: 'Não deu para conferir agora se o CPMR consegue atender esse pedido.',
      detalhe: 'Você pode enviar assim mesmo: a equipe técnica confere ao analisar.',
      enviar: 'Enviar solicitação',
      voltar: 'Voltar',
    }
  }

  if (viabilidade.viavel) {
    return {
      tom: 'sucesso',
      titulo: 'O CPMR consegue atender esse pedido.',
      enviar: 'Enviar solicitação',
      voltar: 'Voltar',
    }
  }

  return {
    tom: 'erro',
    titulo: viabilidade.motivo ?? NAO_DA,
    detalhe: 'Você ainda pode enviar: a equipe técnica analisa o pedido e responde.',
    enviar: 'Enviar mesmo assim',
    voltar: 'Voltar e ajustar',
  }
}
