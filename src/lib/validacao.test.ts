import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validadorDoZod } from './validacao'

const nome = z.string().trim().min(1, 'Informe o nome').max(5, 'No máximo 5 letras')

describe('validadorDoZod', () => {
  it('aceita o valor que o schema aceita', async () => {
    await expect(validadorDoZod(nome)(null, 'Ana')).resolves.toBeUndefined()
  })

  it('recusa com a primeira mensagem do schema, que é a que o formulário mostra', async () => {
    await expect(validadorDoZod(nome)(null, 'Beatriz')).rejects.toThrow('No máximo 5 letras')
  })

  it('trata campo ainda não preenchido como vazio, e não como erro de tipo', async () => {
    await expect(validadorDoZod(nome)(null, undefined)).rejects.toThrow('Informe o nome')
  })
})
