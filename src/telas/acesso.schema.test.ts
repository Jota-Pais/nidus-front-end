import { describe, expect, it } from 'vitest'
import { acesso } from './acesso.schema'

const { email, codigo, nome, senha } = acesso.shape

describe('e-mail — de qualquer domínio', () => {
  it('aceita e-mail da UFSC e de fora dela', () => {
    expect(email.parse('pesquisador@ufsc.br')).toBe('pesquisador@ufsc.br')
    expect(email.parse('aluno@grad.ufsc.br')).toBe('aluno@grad.ufsc.br')
    expect(email.parse('pesquisador@gmail.com')).toBe('pesquisador@gmail.com')
    expect(email.parse('a@empresa.com.br')).toBe('a@empresa.com.br')
  })

  it('recusa o que não tem formato de e-mail, dizendo o formato', () => {
    for (const valor of ['sem-arroba', 'a@', '@b.com', 'a b@c.com']) {
      const r = email.safeParse(valor)
      expect(r.success).toBe(false)
      if (!r.success) expect(r.error.issues[0]?.message).toMatch(/nome@exemplo\.com/)
    }
  })

  it('tira espaço e passa para minúsculas: o mesmo e-mail não vira duas contas', () => {
    expect(email.parse('  Pesquisador@UFSC.br ')).toBe('pesquisador@ufsc.br')
  })

  it('recusa vazio, com mensagem que diz o que fazer', () => {
    const r = email.safeParse('')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/Informe o seu e-mail/)
  })

  it('recusa lista de endereços disfarçada de e-mail', () => {
    for (const valor of ['eu@gmail.com,x@ufsc.br', '"eu@gmail.com"@ufsc.br', 'eu,voce@gmail.com']) {
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
