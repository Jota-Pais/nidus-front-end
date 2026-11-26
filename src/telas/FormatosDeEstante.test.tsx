import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MENSAGEM_DAS_LETRAS } from '@/dominio/formato'
import type { Formato } from '@/dominio/tipos'
import { formato } from '@/testes/estante'
import { erroDaApi } from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { FormatosDeEstante } from './FormatosDeEstante'

const salvarFormato = vi.hoisted(() => vi.fn())
const removerFormato = vi.hoisted(() => vi.fn())

// a ALESCO Modelo 1 é usada pela E-01 e pela E-06; a Bancada, por nenhuma
const FORMATOS: Formato[] = [
  formato(1, 'ALESCO Modelo 1', { faces: 2, linhas: 8, colunas: 8 }, [
    { id: 7, numeroVisivel: 'E-01', sala: 'Sala 1' },
    { id: 12, numeroVisivel: 'E-06', sala: 'Sala 2' },
  ]),
  formato(3, 'Bancada', { faces: 1, linhas: 5, colunas: 4 }),
]

vi.mock('@/dominio/consultas', () => ({
  useFormatos: () => consulta(FORMATOS),
  useSalvarFormato: () => ({
    mutate: salvarFormato,
    mutateAsync: removerFormato,
    isPending: false,
  }),
}))

beforeEach(() => {
  salvarFormato.mockReset()
  removerFormato.mockReset()
})

const abrir = () => renderizar(<FormatosDeEstante aoFechar={() => {}} />, 'tecnico')

/** As linhas de dados da tabela; a busca por papel na janela inteira é lenta no jsdom */
const linhas = () => [...document.querySelectorAll<HTMLElement>('tbody tr.ant-table-row')]

/** A linha do formato, pelo nome */
function linhaDo(nome: string): HTMLElement {
  const achada = linhas().find((tr) => within(tr).queryByText(nome) !== null)
  if (!achada) throw new Error(`sem a linha do ${nome}`)
  return achada
}

function digitar(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

// A janela monta a tabela do antd e o formulário: no jsdom cada caso leva segundos
describe('a lista dos formatos', { timeout: 60_000 }, () => {
  it('mostra as faces, as linhas por colunas, as caixas e as estantes de cada formato', () => {
    abrir()

    expect(
      linhas().map((tr) =>
        [...tr.querySelectorAll('td')].slice(0, 5).map((celula) => celula.textContent),
      ),
    ).toEqual([
      ['ALESCO Modelo 1', '2', '8 × 8', '128', 'E-01, E-06'],
      ['Bancada', '1', '5 × 4', '20', 'Nenhuma'],
    ])
  })

  it('o formato em uso não sai: o Remover fica desabilitado e diz quem usa', () => {
    abrir()

    const emUso = within(linhaDo('ALESCO Modelo 1')).getByRole('button', { name: 'Remover' })
    expect(emUso).toHaveProperty('disabled', true)
    expect(emUso.getAttribute('title')).toBe('Usado por E-01 e E-06')
    expect(within(linhaDo('Bancada')).getByRole('button', { name: 'Remover' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('o formato livre sai depois da confirmação, com o aviso', async () => {
    removerFormato.mockResolvedValue(undefined)
    abrir()

    fireEvent.click(within(linhaDo('Bancada')).getByRole('button', { name: 'Remover' }))

    // a confirmação do antd repete o título para o leitor de tela
    expect(await screen.findAllByText('Remover o formato Bancada?')).not.toHaveLength(0)
    expect(screen.getAllByText('Ele sai da lista de formatos.')).not.toHaveLength(0)
    expect(removerFormato).not.toHaveBeenCalled()

    const confirmacao = document.querySelector<HTMLElement>('.ant-modal-confirm')!
    fireEvent.click(within(confirmacao).getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(removerFormato).toHaveBeenCalledWith({ tipo: 'remover', id: 3 }))
    expect(await screen.findByText('Formato Bancada removido.')).toBeTruthy()
  })
})

describe('o formulário do formato', { timeout: 60_000 }, () => {
  it('Novo formato manda o nome e as medidas, e desenha a estante com elas', async () => {
    salvarFormato.mockImplementation((_pedido, opcoes) =>
      opcoes.onSuccess(formato(9, 'Rack novo', { faces: 2, linhas: 4, colunas: 4 })),
    )
    abrir()

    fireEvent.click(screen.getByRole('button', { name: 'Novo formato' }))
    const nome = await screen.findByLabelText('Nome')
    expect(nome.getAttribute('placeholder')).toBe('ALESCO Modelo 1')
    fireEvent.change(nome, { target: { value: ' Rack novo ' } })
    digitar('Linhas', '4')
    digitar('Colunas', '4')

    // duas faces de 4 colunas: a traseira vai do E ao H
    expect(await screen.findByTitle('T4H')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar formato' }))

    await waitFor(() =>
      expect(salvarFormato).toHaveBeenCalledWith(
        { tipo: 'criar', dados: { nome: 'Rack novo', faces: 2, linhas: 4, colunas: 4 } },
        expect.anything(),
      ),
    )
    expect(await screen.findByText('Formato Rack novo cadastrado.')).toBeTruthy()
  })

  it('faces × colunas não passa de 26, com as palavras da API', async () => {
    abrir()

    fireEvent.click(screen.getByRole('button', { name: 'Novo formato' }))
    fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Larga' } })
    digitar('Linhas', '8')
    digitar('Colunas', '14')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar formato' }))

    expect(await screen.findByText(MENSAGEM_DAS_LETRAS)).toBeTruthy()
    expect(salvarFormato).not.toHaveBeenCalled()

    // com uma face só, as 14 colunas cabem
    fireEvent.click(screen.getByText('1 face'))

    await waitFor(() => expect(screen.queryByText(MENSAGEM_DAS_LETRAS)).toBeNull())
  })

  it('o formato em uso avisa quais estantes mudam junto, e a edição manda só o que mudou', async () => {
    abrir()

    fireEvent.click(within(linhaDo('ALESCO Modelo 1')).getByRole('button', { name: 'Editar' }))

    expect(
      await screen.findByText(
        'Usado pelas estantes E-01 (Sala 1) e E-06 (Sala 2): mudar faces, linhas ou colunas muda essas estantes também.',
      ),
    ).toBeTruthy()
    expect(screen.getByLabelText('Nome')).toHaveProperty('value', 'ALESCO Modelo 1')

    digitar('Colunas', '9')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(salvarFormato).toHaveBeenCalledWith(
        { tipo: 'alterar', id: 1, dados: { colunas: 9 } },
        expect.anything(),
      ),
    )
  })

  it('a recusa da API aparece na janela do formato', async () => {
    salvarFormato.mockImplementation((_pedido, opcoes) =>
      opcoes.onError(
        erroDaApi(
          409,
          'CAIXAS_FORA_DO_FORMATO',
          'A E-01 tem caixa na linha 8: com 7 linhas ela ficaria de fora.',
        ),
      ),
    )
    abrir()

    fireEvent.click(within(linhaDo('ALESCO Modelo 1')).getByRole('button', { name: 'Editar' }))
    digitar('Linhas', '7')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('A E-01 tem caixa na linha 8: com 7 linhas ela ficaria de fora.'),
    ).toBeTruthy()
  })
})

describe('os formatos no celular', { timeout: 60_000 }, () => {
  it('cada formato é um cartão, com as medidas, as estantes e as ações', () => {
    const voltar = larguraDaTela(390)

    try {
      abrir()

      expect(document.querySelector('table')).toBeNull()
      const lista = screen.getByRole('list', { name: 'Formatos' })
      const [alesco, bancada] = within(lista).getAllByRole('listitem')
      expect(within(alesco!).getByText('128 caixas')).toBeTruthy()
      // cada número numa peça que não quebra no hífen: o texto junta as duas
      expect(within(alesco!).getByText('E-01').parentElement?.textContent).toBe('E-01, E-06')
      expect(within(alesco!).getByRole('button', { name: 'Remover' })).toHaveProperty(
        'disabled',
        true,
      )
      expect(within(bancada!).getByText('Nenhuma')).toBeTruthy()
      expect(within(bancada!).getByRole('button', { name: 'Editar' })).toBeTruthy()
    } finally {
      voltar()
    }
  })
})
