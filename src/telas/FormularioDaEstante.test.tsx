import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Estante, Formato } from '@/dominio/tipos'
import { formato, gradeCom } from '@/testes/estante'
import { erroDaApi, selecao } from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { FormularioDaEstante } from './FormularioDaEstante'

const salvarEstante = vi.hoisted(() => vi.fn())
const removerEstante = vi.hoisted(() => vi.fn())
const salvarFormato = vi.hoisted(() => vi.fn())
const usarFormatos = vi.hoisted(() => vi.fn())
const usarGrade = vi.hoisted(() => vi.fn())
const fechar = vi.hoisted(() => vi.fn())

/** As medidas da ALESCO Modelo 1: 2 faces de 8 × 8 */
const DE_8 = { faces: 2, linhas: 8, colunas: 8 }

const FORMATOS: Formato[] = [
  formato(1, 'ALESCO Modelo 1', DE_8, [{ id: 7, numeroVisivel: 'E-01', sala: 'Sala 1' }]),
  formato(2, 'ALESCO Modelo 2', { faces: 2, linhas: 5, colunas: 5 }),
  formato(3, 'Bancada', { faces: 1, linhas: 5, colunas: 4 }),
  formato(4, 'Larga', { faces: 2, linhas: 8, colunas: 9 }),
]

/** A E-01 da Sala 1, ALESCO Modelo 1 */
const e01: Estante = {
  id: 7,
  idSala: 1,
  sala: 'Sala 1',
  idFormato: 1,
  formato: 'ALESCO Modelo 1',
  numeroVisivel: 'E-01',
  ...DE_8,
}

vi.mock('@/dominio/consultas', () => ({
  useSalas: () =>
    consulta([
      { id: 1, nome: 'Sala 1', estantes: 1 },
      { id: 2, nome: 'Sala 2', estantes: 0 },
    ]),
  useEstantes: () => consulta([e01]),
  useFormatos: usarFormatos,
  useGrade: usarGrade,
  useSalvarEstante: () => ({
    mutate: salvarEstante,
    mutateAsync: removerEstante,
    isPending: false,
  }),
  useSalvarFormato: () => ({ mutate: salvarFormato, isPending: false }),
}))

beforeEach(() => {
  for (const simulada of [salvarEstante, removerEstante, salvarFormato, fechar]) {
    simulada.mockReset()
  }
  usarFormatos.mockReturnValue(consulta(FORMATOS))
  // a E-01 vazia, a não ser que o teste ponha caixa nela
  usarGrade.mockReturnValue(consulta(gradeCom(DE_8)))
})

function abrir(estante: Estante | null = e01) {
  renderizar(<FormularioDaEstante estante={estante} aoFechar={fechar} />, 'tecnico')
}

/** Escolhe o formato pela opção da lista, que diz as medidas */
function escolherFormato(opcao: string) {
  fireEvent.mouseDown(selecao('Formato'))
  fireEvent.click(screen.getByTitle(opcao))
}

const salvar = () => screen.getByRole('button', { name: 'Salvar' })

// O formulário tem dois Select do antd e a estante em miniatura: no jsdom cada caso leva segundos
describe('cadastro', { timeout: 60_000 }, () => {
  it('a lista dos formatos diz as medidas de cada um e termina no Novo formato', () => {
    abrir(null)

    fireEvent.mouseDown(selecao('Formato'))

    const opcoes = [...document.querySelectorAll('.ant-select-item-option')].map(
      (opcao) => opcao.textContent,
    )
    expect(opcoes).toEqual([
      'ALESCO Modelo 1 · 2 faces de 8 × 8 (128 caixas)',
      'ALESCO Modelo 2 · 2 faces de 5 × 5 (50 caixas)',
      'Bancada · 1 face de 5 × 4 (20 caixas)',
      'Larga · 2 faces de 8 × 9 (144 caixas)',
      'Novo formato',
    ])
  })

  it('abre com a primeira sala, o primeiro formato e o número seguinte, e manda o formato escolhido', async () => {
    abrir(null)

    expect(screen.getByLabelText('Número da estante')).toHaveProperty('value', 'E-02')
    expect(screen.getByTitle('ALESCO Modelo 1 · 2 faces de 8 × 8 (128 caixas)')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remover estante' })).toBeNull()

    escolherFormato('Bancada · 1 face de 5 × 4 (20 caixas)')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar estante' }))

    await waitFor(() =>
      expect(salvarEstante).toHaveBeenCalledWith(
        { tipo: 'criar', dados: { idSala: 1, idFormato: 3, numeroVisivel: 'E-02' } },
        expect.anything(),
      ),
    )
  })

  it('a miniatura desenha as medidas do formato escolhido, com o código de cada posição', async () => {
    abrir(null)

    // 2 faces de 8 × 8: a traseira continua as letras da frontal
    expect(await screen.findByTitle('F8H')).toBeTruthy()
    expect(screen.getByTitle('T1I')).toBeTruthy()
    expect(screen.getByText('Traseira')).toBeTruthy()

    escolherFormato('Bancada · 1 face de 5 × 4 (20 caixas)')

    expect(await screen.findByTitle('F5D')).toBeTruthy()
    expect(screen.queryByTitle('F8H')).toBeNull()
    expect(screen.queryByText('Traseira')).toBeNull()
  })

  it('Novo formato abre o formulário por cima, e o formato cadastrado já fica escolhido', async () => {
    const novo = formato(9, 'Rack novo', { faces: 2, linhas: 4, colunas: 4 })
    salvarFormato.mockImplementation((_pedido, opcoes) => {
      // a lista dos formatos recarrega antes do sucesso, já com o novo
      usarFormatos.mockReturnValue(consulta([...FORMATOS, novo]))
      opcoes.onSuccess(novo)
    })
    abrir(null)

    fireEvent.mouseDown(selecao('Formato'))
    fireEvent.click(screen.getByText('Novo formato'))
    fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Rack novo' } })
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar formato' }))

    await waitFor(() =>
      expect(salvarFormato).toHaveBeenCalledWith(
        { tipo: 'criar', dados: { nome: 'Rack novo', faces: 2, linhas: 4, colunas: 4 } },
        expect.anything(),
      ),
    )
    expect(await screen.findByTitle('Rack novo · 2 faces de 4 × 4 (32 caixas)')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar estante' }))

    await waitFor(() =>
      expect(salvarEstante).toHaveBeenCalledWith(
        { tipo: 'criar', dados: { idSala: 1, idFormato: 9, numeroVisivel: 'E-02' } },
        expect.anything(),
      ),
    )
  })
})

describe('edição', { timeout: 60_000 }, () => {
  it('a miniatura marca as posições com caixa', async () => {
    usarGrade.mockReturnValue(consulta(gradeCom(DE_8, ['frontal', 1, 1], ['traseira', 2, 3])))
    abrir()

    expect(await screen.findByTitle('F1A: com caixa')).toBeTruthy()
    expect(screen.getByTitle('T2K: com caixa')).toBeTruthy()
    expect(screen.getByTitle('F1B')).toBeTruthy()
  })

  it('o formato que deixa caixa de fora diz quais e não deixa salvar', async () => {
    usarGrade.mockReturnValue(
      consulta(gradeCom(DE_8, ['frontal', 1, 1], ['frontal', 8, 1], ['traseira', 8, 3])),
    )
    abrir()

    escolherFormato('ALESCO Modelo 2 · 2 faces de 5 × 5 (50 caixas)')

    expect(
      await screen.findByText(
        'As caixas F8A e T8K ficam fora deste formato. Mude-as de lugar antes de trocar.',
      ),
    ).toBeTruthy()
    expect(salvar()).toHaveProperty('disabled', true)

    // o envio que chega por outro caminho que não o Salvar também não passa
    fireEvent.submit(screen.getByLabelText('Número da estante').closest('form')!)
    await new Promise((pronto) => setTimeout(pronto, 50))
    expect(salvarEstante).not.toHaveBeenCalled()

    // de volta ao formato dela, nenhuma fica de fora
    escolherFormato('ALESCO Modelo 1 · 2 faces de 8 × 8 (128 caixas)')

    await waitFor(() => expect(screen.queryByText(/fora deste formato/)).toBeNull())
    expect(salvar()).toHaveProperty('disabled', false)
  })

  it('com uma caixa de fora, o aviso fala dela no singular', async () => {
    usarGrade.mockReturnValue(consulta(gradeCom(DE_8, ['frontal', 8, 1])))
    abrir()

    escolherFormato('ALESCO Modelo 2 · 2 faces de 5 × 5 (50 caixas)')

    expect(
      await screen.findByText(
        'A caixa F8A fica fora deste formato. Mude-a de lugar antes de trocar.',
      ),
    ).toBeTruthy()
  })

  it('com outras colunas, avisa a letra nova da traseira e manda só o formato', async () => {
    abrir()

    escolherFormato('Larga · 2 faces de 8 × 9 (144 caixas)')

    expect(
      await screen.findByText('Com 9 colunas, as letras da face traseira mudam: T1I passa a T1J.'),
    ).toBeTruthy()
    fireEvent.click(salvar())

    await waitFor(() =>
      expect(salvarEstante).toHaveBeenCalledWith(
        { tipo: 'alterar', id: 7, dados: { idFormato: 4 } },
        expect.anything(),
      ),
    )
  })

  it('o número e a sala vão sozinhos quando só eles mudam', async () => {
    abrir()

    fireEvent.change(screen.getByLabelText('Número da estante'), { target: { value: ' E-09 ' } })
    fireEvent.click(salvar())

    await waitFor(() =>
      expect(salvarEstante).toHaveBeenCalledWith(
        { tipo: 'alterar', id: 7, dados: { numeroVisivel: 'E-09' } },
        expect.anything(),
      ),
    )
  })

  it('sem nada mudado, Salvar fecha sem chamar a API', async () => {
    abrir()

    fireEvent.click(salvar())

    await waitFor(() => expect(fechar).toHaveBeenCalled())
    expect(salvarEstante).not.toHaveBeenCalled()
  })

  it('o campo que a API aponta fica destacado', async () => {
    salvarEstante.mockImplementation((_pedido, opcoes) =>
      opcoes.onError(
        erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
          idFormato: 'Escolha um formato cadastrado.',
        }),
      ),
    )
    abrir()

    escolherFormato('Larga · 2 faces de 8 × 9 (144 caixas)')
    fireEvent.click(salvar())

    expect(await screen.findByText('Escolha um formato cadastrado.')).toBeTruthy()
    expect(fechar).not.toHaveBeenCalled()
  })

  it('a recusa sem campo aparece no aviso da janela', async () => {
    salvarEstante.mockImplementation((_pedido, opcoes) =>
      opcoes.onError(erroDaApi(409, 'ESTANTE_DUPLICADA', 'Já existe a estante E-03 na Sala 1.')),
    )
    abrir()

    fireEvent.change(screen.getByLabelText('Número da estante'), { target: { value: 'E-03' } })
    fireEvent.click(salvar())

    expect(await screen.findByText('Já existe a estante E-03 na Sala 1.')).toBeTruthy()
    expect(fechar).not.toHaveBeenCalled()
  })
})

describe('remover a estante', { timeout: 60_000 }, () => {
  it('com caixa, o botão fica desabilitado e diz quantas tem', () => {
    usarGrade.mockReturnValue(
      consulta(gradeCom(DE_8, ['frontal', 1, 1], ['frontal', 2, 2], ['traseira', 1, 1])),
    )
    abrir()

    const remover = screen.getByRole('button', { name: 'Remover estante' })
    expect(remover).toHaveProperty('disabled', true)
    expect(remover.getAttribute('title')).toBe(
      'Só dá para remover a estante vazia. Esta tem 3 caixas.',
    )
    // no computador, à esquerda do rodapé
    expect(remover.closest('.ant-modal-footer')).toBeTruthy()
  })

  it('com uma caixa, fala dela no singular', () => {
    usarGrade.mockReturnValue(consulta(gradeCom(DE_8, ['traseira', 8, 8])))
    abrir()

    expect(screen.getByRole('button', { name: 'Remover estante' }).getAttribute('title')).toBe(
      'Só dá para remover a estante vazia. Esta tem 1 caixa.',
    )
  })

  it('enquanto a grade carrega, não dá para saber se está vazia', () => {
    usarGrade.mockReturnValue({ data: undefined, isPending: true, error: null })
    abrir()

    expect(screen.getByRole('button', { name: 'Remover estante' })).toHaveProperty('disabled', true)
  })

  it('a vazia sai depois da confirmação, com o aviso, e a janela fecha', async () => {
    removerEstante.mockResolvedValue(undefined)
    abrir()

    fireEvent.click(screen.getByRole('button', { name: 'Remover estante' }))

    // a confirmação do antd repete o título para o leitor de tela
    expect(await screen.findAllByText('Remover a estante E-01?')).not.toHaveLength(0)
    expect(
      screen.getAllByText(
        'Ela sai da grade da Sala 1. Só dá para remover a estante vazia, sem caixa em nenhuma posição.',
      ),
    ).not.toHaveLength(0)
    expect(removerEstante).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(removerEstante).toHaveBeenCalledWith({ tipo: 'remover', id: 7 }))
    expect(await screen.findByText('Estante E-01 removida.')).toBeTruthy()
    expect(fechar).toHaveBeenCalled()
  })
})

describe('no celular', { timeout: 60_000 }, () => {
  it('o Remover estante vai para o fim da janela, com o motivo à vista', () => {
    const voltar = larguraDaTela(390)

    try {
      usarGrade.mockReturnValue(consulta(gradeCom(DE_8, ['frontal', 1, 1])))
      abrir()

      const remover = screen.getByRole('button', { name: 'Remover estante' })
      expect(remover.closest('.ant-modal-footer')).toBeNull()
      expect(remover.closest('.ant-modal-body')).toBeTruthy()
      const fim = remover.closest<HTMLElement>('.formularioDaEstante__remover')!
      expect(
        within(fim).getByText('Só dá para remover a estante vazia. Esta tem 1 caixa.'),
      ).toBeTruthy()
    } finally {
      voltar()
    }
  })
})
