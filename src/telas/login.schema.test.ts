import { describe, expect, it } from 'vitest'
import { credenciais } from './login.schema'

describe('credenciais — só e-mail e senha', () => {
  it('aceita e-mail institucional e senha', () => {
    const r = credenciais.safeParse({ email: 'tecnico@ufsc.br', senha: 'seg' })
    expect(r.success).toBe(true)
  })

  it('coleta só os dois campos que o POST /api/sessao espera', () => {
    const r = credenciais.parse({ email: 'a@ufsc.br', senha: 'x' })
    expect(Object.keys(r).sort()).toEqual(['email', 'senha'])
  })

  it('descarta campo extra em vez de repassar dado que ninguém pediu', () => {
    const r = credenciais.parse({ email: 'a@ufsc.br', senha: 'x', cpf: '000.000.000-00' })
    expect(r).not.toHaveProperty('cpf')
  })

  it('tira espaço em volta do e-mail — colar do webmail traz espaço', () => {
    expect(credenciais.parse({ email: '  a@ufsc.br  ', senha: 'x' }).email).toBe('a@ufsc.br')
  })

  it('passa o e-mail para minúsculas, que é como o primeiro acesso grava a conta', () => {
    expect(credenciais.parse({ email: 'Ana.Souza@UFSC.br', senha: 'x' }).email).toBe(
      'ana.souza@ufsc.br',
    )
  })

  it('recusa e-mail vazio, com mensagem que diz o que fazer', () => {
    const r = credenciais.safeParse({ email: '', senha: 'x' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/Informe o e-mail/)
  })

  it('recusa e-mail malformado', () => {
    const r = credenciais.safeParse({ email: 'tecnico', senha: 'x' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/inválido/)
  })

  it('recusa senha vazia', () => {
    const r = credenciais.safeParse({ email: 'a@ufsc.br', senha: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/Informe a senha/)
  })

  it('não impõe regra de força de senha: quem valida credencial é o servidor', () => {
    expect(credenciais.safeParse({ email: 'a@ufsc.br', senha: '1' }).success).toBe(true)
  })
})
