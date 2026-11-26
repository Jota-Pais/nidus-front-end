import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Sala } from '@/dominio/tipos'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { Cadastros } from './Cadastros'

const salvarSala = vi.hoisted(() => vi.fn())
const removerSala = vi.hoisted(() => vi.fn())

const salas: Sala[] = [
  { id: 1, nome: 'Sala 1', estantes: 1 },
  { id: 4, nome: 'Sala 4', estantes: 0 },
]

vi.mock('@/dominio/consultas', () => ({
  useProjetos: () => consulta([]),
  useUsuarios: () => consulta([]),
  useCatalogo: () => consulta({ especies: [] }),
  useSalvarProjeto: mutacao,
  useSalvarLinhagem: mutacao,
  useSalas: () => consulta(salas),
  useSalvarSala: () => ({ mutate: salvarSala, mutateAsync: removerSala, isPending: false }),
}))

beforeEach(() => {
  salvarSala.mockReset()
  removerSala.mockReset()
})

/** Os Cadastros na aba das salas: a tela abre nas linhagens */
function abrirAba() {
  renderizar(<Cadastros />, 'gestor')
  fireEvent.click(screen.getByRole('tab', { name: 'Salas' }))
}

/** A linha da tabela com o texto */
function linha(texto: string): HTMLElement {
  const achada = screen.getAllByRole('row').find((tr) => within(tr).queryByText(texto) !== null)
  if (!achada) throw new Error(`sem linha com ${texto}`)
  return achada
}

const descricao = () => document.querySelector('.cabecalhoDaTela__descricao')?.textContent ?? ''

describe('abas', () => {
  it('o gestor cadastra linhagens e salas; os projetos CEUA ficam ocultos', () => {
    renderizar(<Cadastros />, 'gestor')

    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Linhagens', 'Salas'])
  })

  // sem useEstantes no mock: se os Cadastros voltassem a listar estantes, a tela nem abriria
  it('a estante mora na tela das estantes: aqui não tem estante', () => {
    abrirAba()

    expect(descricao()).not.toMatch(/estante/i)
    expect(screen.queryByRole('button', { name: 'Nova estante' })).toBeNull()
  })
})

// A aba monta a tabela do antd: no jsdom cada caso leva segundos, e os 5 s padrão falham à toa
describe('salas', { timeout: 60_000 }, () => {
  it('lista a sala sem estante junto com as outras', () => {
    abrirAba()

    expect(within(linha('Sala 4')).getByText('0')).toBeTruthy()
    expect(within(linha('Sala 1')).getByText('1')).toBeTruthy()
  })

  it('renomear manda o nome novo da sala', async () => {
    abrirAba()

    fireEvent.click(within(linha('Sala 4')).getByRole('button', { name: 'Renomear' }))
    fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: ' Sala B ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(salvarSala).toHaveBeenCalledWith(
        { tipo: 'renomear', id: 4, nome: 'Sala B' },
        expect.anything(),
      ),
    )
  })

  it('remover pede confirmação e mostra a recusa da API', async () => {
    removerSala.mockRejectedValue(new Error('Sala 1 ainda tem 1 estante.'))
    abrirAba()

    fireEvent.click(within(linha('Sala 1')).getByRole('button', { name: 'Remover' }))

    expect(await screen.findAllByText('Remover Sala 1?')).not.toHaveLength(0)
    expect(removerSala).not.toHaveBeenCalled()

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(removerSala).toHaveBeenCalledWith({ tipo: 'remover', id: 1 }))
    expect(await screen.findByText('Sala 1 ainda tem 1 estante.')).toBeTruthy()
  })
})

describe('salas no celular', { timeout: 60_000 }, () => {
  it('cada sala é um cartão, com as ações em botões', async () => {
    const voltar = larguraDaTela(390)
    try {
      abrirAba()

      expect(document.querySelector('.ant-tabs-tabpane-active table')).toBeNull()
      const salasNaTela = screen.getByRole('list', { name: 'Salas' })
      const sala4 = within(salasNaTela).getByText('Sala 4').closest('li')!
      expect(within(sala4).getByText('0 estantes')).toBeTruthy()

      fireEvent.click(within(sala4).getByRole('button', { name: 'Renomear' }))
      fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Sala B' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      await waitFor(() =>
        expect(salvarSala).toHaveBeenCalledWith(
          { tipo: 'renomear', id: 4, nome: 'Sala B' },
          expect.anything(),
        ),
      )
    } finally {
      voltar()
    }
  })
})
