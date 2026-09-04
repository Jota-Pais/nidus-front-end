import { describe, expect, it } from 'vitest'
import { ErroDeApi, ErroDeRede } from '@/lib/api'
import { chaves } from './chaves'
import { criarQueryClient } from './queryClient'

/**
 * O tratamento global de 401 é o que manda o usuário ao login de qualquer
 * requisição — inclusive uma que rodou em segundo plano enquanto o técnico
 * estava na sala. Estes testes disparam o `onError` do cache pela consulta de
 * verdade, não pela função interna.
 */
async function rodarConsulta(
  cliente: ReturnType<typeof criarQueryClient>,
  queryKey: readonly unknown[],
  erro: Error,
) {
  await cliente
    .fetchQuery({ queryKey, queryFn: () => Promise.reject(erro), retry: false })
    .catch(() => undefined)
}

const naoAutenticado = () =>
  new ErroDeApi(401, { erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'x' } })

describe('tratamento global de 401', () => {
  it('zera a sessão em cache, o que leva ao login', async () => {
    const cliente = criarQueryClient()
    cliente.setQueryData(chaves.sessao, { id: 1, nome: 'Ana', email: 'a@ufsc.br', perfil: 'tecnico' })

    await rodarConsulta(cliente, chaves.estantes, naoAutenticado())

    expect(cliente.getQueryData(chaves.sessao)).toBeNull()
  })

  it('vale para qualquer consulta, não só a da tela aberta', async () => {
    const cliente = criarQueryClient()
    cliente.setQueryData(chaves.sessao, { id: 1, nome: 'Ana', email: 'a@ufsc.br', perfil: 'gestor' })

    await rodarConsulta(cliente, chaves.grade(7), naoAutenticado())

    expect(cliente.getQueryData(chaves.sessao)).toBeNull()
  })

  it('não derruba a sessão em 403: autenticado, só sem alcance no recurso', async () => {
    const cliente = criarQueryClient()
    const usuario = { id: 1, nome: 'Ana', email: 'a@ufsc.br', perfil: 'pesquisador' }
    cliente.setQueryData(chaves.sessao, usuario)

    await rodarConsulta(
      cliente,
      chaves.estantes,
      new ErroDeApi(403, { erro: { codigo: 'SEM_PERMISSAO', mensagem: 'x' } }),
    )

    expect(cliente.getQueryData(chaves.sessao)).toEqual(usuario)
  })

  it('não derruba a sessão em falha de rede: a API dormindo não é logout', async () => {
    const cliente = criarQueryClient()
    const usuario = { id: 1, nome: 'Ana', email: 'a@ufsc.br', perfil: 'tecnico' }
    cliente.setQueryData(chaves.sessao, usuario)

    await rodarConsulta(cliente, chaves.estantes, new ErroDeRede(new TypeError('Failed to fetch')))

    expect(cliente.getQueryData(chaves.sessao)).toEqual(usuario)
  })

  it('a própria consulta de sessão não entra em laço de invalidação', async () => {
    const cliente = criarQueryClient()
    await rodarConsulta(cliente, chaves.sessao, naoAutenticado())
    // Não deve ter sido sobrescrita pelo tratamento global: quem responde
    // null no 401 é a própria useSessao.
    expect(cliente.getQueryData(chaves.sessao)).toBeUndefined()
  })
})
