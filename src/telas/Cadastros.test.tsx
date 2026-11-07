import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Estante, Sala } from '@/dominio/tipos'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { Cadastros } from './Cadastros'

const salvarSala = vi.hoisted(() => vi.fn())
const removerSala = vi.hoisted(() => vi.fn())
const salvarEstante = vi.hoisted(() => vi.fn())
const removerEstante = vi.hoisted(() => vi.fn())

const salas: Sala[] = [
  { id: 1, nome: 'Sala 1', estantes: 1 },
  { id: 4, nome: 'Sala 4', estantes: 0 },
]

const estantes: Estante[] = [
  {
    id: 7,
    idSala: 1,
    sala: 'Sala 1',
    fabricante: 'ALESCO',
    modelo: 'Modelo 1',
    numeroVisivel: 'E-01',
    faces: 2,
    linhas: 8,
    colunas: 8,
  },
]

vi.mock('@/dominio/consultas', () => ({
  useProjetos: () => consulta([]),
  useUsuarios: () => consulta([]),
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useSalvarProjeto: mutacao,
  useSalvarLinhagem: mutacao,
  useSalas: () => consulta(salas),
  useEstantes: () => consulta(estantes),
  useSalvarSala: () => ({ mutate: salvarSala, mutateAsync: removerSala, isPending: false }),
  useSalvarEstante: () => ({
    mutate: salvarEstante,
    mutateAsync: removerEstante,
    isPending: false,
  }),
}))

beforeEach(() => {
  salvarSala.mockReset()
  removerSala.mockReset()
  salvarEstante.mockReset()
  removerEstante.mockReset()
})

function abrirAba() {
  renderizar(<Cadastros />, 'gestor')
  fireEvent.click(screen.getByRole('tab', { name: 'Salas e estantes' }))
}

/** A linha da tabela com o texto e o botão pedidos: "Sala 1" aparece nas duas tabelas */
function linha(texto: string, botao: string): HTMLElement {
  const achada = screen
    .getAllByRole('row')
    .find(
      (tr) =>
        within(tr).queryByText(texto) !== null &&
        within(tr).queryByRole('button', { name: botao }) !== null,
    )
  if (!achada) throw new Error(`sem linha com ${texto} e ${botao}`)
  return achada
}

// A aba monta duas tabelas do antd, e o formulário da estante tem dois Select: no jsdom cada
// caso leva de 15 a 30 s, como na busca de atendimento, e os 5 s padrão falham à toa
describe('salas', { timeout: 60_000 }, () => {
  it('lista a sala sem estante junto com as outras', () => {
    abrirAba()

    expect(within(linha('Sala 4', 'Renomear')).getByText('0')).toBeTruthy()
    expect(within(linha('Sala 1', 'Renomear')).getByText('1')).toBeTruthy()
  })

  it('renomear manda o nome novo da sala', async () => {
    abrirAba()

    fireEvent.click(within(linha('Sala 4', 'Renomear')).getByRole('button', { name: 'Renomear' }))
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

    fireEvent.click(within(linha('Sala 1', 'Renomear')).getByRole('button', { name: 'Remover' }))

    expect(await screen.findAllByText('Remover Sala 1?')).not.toHaveLength(0)
    expect(removerSala).not.toHaveBeenCalled()

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(removerSala).toHaveBeenCalledWith({ tipo: 'remover', id: 1 }))
    expect(await screen.findByText('Sala 1 ainda tem 1 estante.')).toBeTruthy()
  })
})

describe('estantes', { timeout: 60_000 }, () => {
  it('nova estante manda a sala e o modelo escolhido, com a topologia dele', async () => {
    abrirAba()

    fireEvent.click(screen.getByRole('button', { name: 'Nova estante' }))
    fireEvent.change(await screen.findByLabelText('Número da estante'), {
      target: { value: 'E-05' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar estante' }))

    await waitFor(() =>
      expect(salvarEstante).toHaveBeenCalledWith(
        {
          tipo: 'criar',
          dados: {
            idSala: 1,
            numeroVisivel: 'E-05',
            faces: 2,
            fabricante: 'ALESCO',
            modelo: 'Modelo 1',
            linhas: 8,
            colunas: 8,
          },
        },
        expect.anything(),
      ),
    )
  })

  it('editar mostra o modelo travado e manda só o número e a sala', async () => {
    abrirAba()

    fireEvent.click(within(linha('E-01', 'Editar')).getByRole('button', { name: 'Editar' }))

    const modelo = await screen.findByDisplayValue('ALESCO Modelo 1 - 8 x 8 por face (128 caixas)')
    expect((modelo as HTMLInputElement).disabled).toBe(true)

    fireEvent.change(screen.getByLabelText('Número da estante'), { target: { value: 'E-09' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(salvarEstante).toHaveBeenCalledWith(
        { tipo: 'alterar', id: 7, dados: { numeroVisivel: 'E-09', idSala: 1 } },
        expect.anything(),
      ),
    )
  })

  it('remover pede confirmação, e Cancelar não remove nada', async () => {
    abrirAba()

    fireEvent.click(within(linha('E-01', 'Editar')).getByRole('button', { name: 'Remover' }))

    expect(await screen.findAllByText('Remover a estante E-01?')).not.toHaveLength(0)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryAllByText('Remover a estante E-01?')).toHaveLength(0))
    expect(removerEstante).not.toHaveBeenCalled()
  })

  it('remover confirmado chama a API e avisa', async () => {
    removerEstante.mockResolvedValue(undefined)
    abrirAba()

    fireEvent.click(within(linha('E-01', 'Editar')).getByRole('button', { name: 'Remover' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remover' }),
    )

    await waitFor(() => expect(removerEstante).toHaveBeenCalledWith({ tipo: 'remover', id: 7 }))
    expect(await screen.findByText('Estante E-01 removida.')).toBeTruthy()
  })
})
