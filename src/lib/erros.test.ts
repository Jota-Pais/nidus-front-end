import { describe, expect, it } from 'vitest'
import { CREDENCIAL_INVALIDA, ehRespostaDeErro, mensagemDeErro } from './erros'

const naoAutenticado = {
  erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Usuário tecnico@ufsc.br não existe.' },
}

describe('mensagemDeErro — 401 não distingue e-mail de senha', () => {
  it('usa a mensagem única mesmo que o servidor mande uma específica', () => {
    expect(mensagemDeErro(401, naoAutenticado)).toBe(CREDENCIAL_INVALIDA)
  })

  it('não vaza o e-mail que o servidor devolveu', () => {
    expect(mensagemDeErro(401, naoAutenticado)).not.toContain('tecnico@ufsc.br')
  })

  it('vale também quando o corpo vem vazio ou fora da forma', () => {
    expect(mensagemDeErro(401, null)).toBe(CREDENCIAL_INVALIDA)
    expect(mensagemDeErro(401, '<html>gateway</html>')).toBe(CREDENCIAL_INVALIDA)
  })
})

describe('mensagemDeErro — demais status', () => {
  it('repassa a mensagem do servidor em regra de negócio (409)', () => {
    const corpo = {
      erro: {
        codigo: 'SOLICITACAO_JA_ALOCADA',
        mensagem: 'A solicitação #12 já foi alocada.',
      },
    }
    expect(mensagemDeErro(409, corpo)).toBe(corpo.erro.mensagem)
  })

  it('não vaza detalhe interno em 500', () => {
    const corpo = { erro: { codigo: 'ERRO_INTERNO', mensagem: 'ECONNREFUSED 10.0.0.4:5432' } }
    const mensagem = mensagemDeErro(500, corpo)
    expect(mensagem).not.toContain('ECONNREFUSED')
    expect(mensagem).not.toContain('5432')
  })

  it('cai na mensagem genérica quando o corpo não segue o contrato', () => {
    expect(mensagemDeErro(502, '<html>Bad Gateway</html>')).toMatch(/Tente de novo/)
  })
})

describe('ehRespostaDeErro', () => {
  it('aceita a forma do contrato', () => {
    expect(ehRespostaDeErro({ erro: { codigo: 'VALIDACAO', mensagem: 'x' } })).toBe(true)
  })

  it('recusa corpo que não é do contrato', () => {
    expect(ehRespostaDeErro(null)).toBe(false)
    expect(ehRespostaDeErro({ erro: 'falhou' })).toBe(false)
    expect(ehRespostaDeErro({ erro: { codigo: 'X' } })).toBe(false)
    expect(ehRespostaDeErro({ mensagem: 'x' })).toBe(false)
  })
})
