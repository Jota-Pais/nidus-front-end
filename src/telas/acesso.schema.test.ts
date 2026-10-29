import { describe, expect, it } from 'vitest'
import { acesso } from './acesso.schema'

const { email, codigo, nome, senha } = acesso.shape

describe('e-mail — só da UFSC', () => {
  it('aceita o domínio ufsc.br', () => {
    expect(email.parse('pesquisador@ufsc.br')).toBe('pesquisador@ufsc.br')
  })

  it('aceita subdomínio, que é o e-mail de aluno', () => {
    expect(email.safeParse('aluno@grad.ufsc.br').success).toBe(true)
    expect(email.safeParse('aluna@posgrad.ufsc.br').success).toBe(true)
  })

  it('recusa e-mail de fora da UFSC, dizendo qual e-mail usar', () => {
    const r = email.safeParse('pesquisador@gmail.com')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/terminado em ufsc\.br/)
  })

  it('recusa domínio que só termina parecido', () => {
    expect(email.safeParse('a@naoufsc.br').success).toBe(false)
    expect(email.safeParse('a@ufsc.br.com').success).toBe(false)
  })

  it('tira espaço e passa para minúsculas: o mesmo e-mail não vira duas contas', () => {
    expect(email.parse('  Pesquisador@UFSC.br ')).toBe('pesquisador@ufsc.br')
  })

  it('recusa vazio, com mensagem que diz o que fazer', () => {
    const r = email.safeParse('')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/Informe o seu e-mail/)
  })

  it('recusa lista de endereços disfarçada de e-mail da UFSC', () => {
    for (const valor of ['eu@gmail.com,x@ufsc.br', '"eu@gmail.com"@ufsc.br']) {
      expect(email.safeParse(valor).success).toBe(false)
    }
  })

  it('recusa e-mail maior que a coluna do banco', () => {
    expect(email.safeParse(`${'a'.repeat(160)}@ufsc.br`).success).toBe(false)
  })
})

describe('código — 6 números', () => {
  it('aceita 6 números', () => {
    expect(codigo.parse('123456')).toBe('123456')
  })

  it('tira o espaço que vem junto quando se copia do e-mail', () => {
    expect(codigo.parse(' 123 456 ')).toBe('123456')
  })

  it('recusa código curto, comprido ou com letra', () => {
    for (const valor of ['12345', '1234567', '12a456', '']) {
      expect(codigo.safeParse(valor).success).toBe(false)
    }
  })
})

describe('nome e senha', () => {
  it('tira espaço do nome e recusa nome vazio', () => {
    expect(nome.parse('  Ana Souza ')).toBe('Ana Souza')
    expect(nome.safeParse('   ').success).toBe(false)
  })

  it('recusa nome maior que a coluna do banco', () => {
    expect(nome.safeParse('a'.repeat(121)).success).toBe(false)
  })

  it('exige pelo menos 8 caracteres, o mesmo mínimo do back-end', () => {
    expect(senha.safeParse('1234567').success).toBe(false)
    expect(senha.safeParse('12345678').success).toBe(true)
  })
})
