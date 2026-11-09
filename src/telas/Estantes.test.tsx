import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Estante, Grade } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { Estantes } from './Estantes'

const mover = vi.hoisted(() => vi.fn())

const estante = (id: number, sala: string, numeroVisivel: string): Estante => ({
  id,
  idSala: id,
  sala,
  fabricante: 'ALESCO',
  modelo: 'Modelo 2',
  numeroVisivel,
  faces: 2,
  linhas: 5,
  colunas: 5,
})

// a E-01 com uma caixa na F1A e a F1B vazia
const grade: Grade = {
  faces: [
    {
      face: 'frontal',
      posicoes: [
        {
          linha: 1,
          coluna: 1,
          codigo: 'F1A',
          caixa: { id: 10, estado: 'livres', linhagem: 'Wistar', casal: null, estoque: null },
        },
        { linha: 1, coluna: 2, codigo: 'F1B', caixa: null },
        {
          linha: 1,
          coluna: 3,
          codigo: 'F1C',
          caixa: {
            id: 11,
            estado: 'reserva',
            linhagem: 'Wistar',
            casal: null,
            estoque: {
              sexo: 'F',
              idLinhagem: 2,
              total: 4,
              reservado: 4,
              nascimentoDe: '2026-09-20',
              nascimentoAte: '2026-10-10',
              grupos: [
                { dtNascimento: '2026-09-20', idadeDias: 50, total: 1, reservados: 1 },
                { dtNascimento: '2026-10-10', idadeDias: 30, total: 3, reservados: 3 },
              ],
            },
          },
        },
        {
          linha: 1,
          coluna: 4,
          codigo: 'F1D',
          caixa: {
            id: 12,
            estado: 'livres',
            linhagem: 'Wistar',
            casal: {
              identificacao: 'AB',
              partoAtual: 2,
              partoPrevisto: '2026-11-20',
              encerrado: false,
              aguardandoDesmame: false,
              ninhadas: [{ casal: 'AB', parto: 1, m: 3, f: 2, idadeDias: 30, mamando: false }],
              reservado: 2,
            },
            estoque: null,
          },
        },
        {
          linha: 1,
          coluna: 5,
          codigo: 'F1E',
          caixa: { id: 13, estado: null, linhagem: 'Wistar', casal: null, estoque: null },
        },
      ],
    },
  ],
}

vi.mock('@/dominio/consultas', () => ({
  useEstantes: () => consulta([estante(1, 'Sala 1', 'E-01'), estante(2, 'Sala 2', 'E-03')]),
  useGrade: () => consulta(grade),
  useMudarDePosicao: () => ({ mutate: mover, isPending: false }),
}))

// a ficha tem as consultas dela; aqui ela fica fechada e não importa
vi.mock('./FichaDaCaixa', () => ({ FichaDaCaixa: () => null }))

beforeEach(() => {
  mover.mockReset()
})

/** O DataTransfer do navegador, que o jsdom não tem */
const dataTransfer = () => ({
  setData: vi.fn(),
  getData: vi.fn(),
  effectAllowed: '',
  dropEffect: '',
})

const caixaF1A = () => screen.getByRole('button', { name: /^F1A/ })
const vaziaF1B = () => screen.getByRole('button', { name: 'F1B' })

/** Pega a caixa da F1A e solta na F1B, como o navegador dispara */
function arrastarF1AParaF1B() {
  const transferencia = dataTransfer()
  fireEvent.dragStart(caixaF1A(), { dataTransfer: transferencia })
  fireEvent.dragEnter(vaziaF1B(), { dataTransfer: transferencia })
  fireEvent.dragOver(vaziaF1B(), { dataTransfer: transferencia })
  fireEvent.drop(vaziaF1B(), { dataTransfer: transferencia })
}

describe('tela Estantes', { timeout: 20_000 }, () => {
  it('não cadastra estante: o cadastro é só nos Cadastros, nem o gestor vê o botão', () => {
    renderizar(<Estantes />, 'gestor')

    expect(screen.queryByRole('button', { name: 'Nova estante' })).toBeNull()
  })

  it('continua separando as estantes por sala, pelo nome que vem na estante', () => {
    renderizar(<Estantes />, 'tecnico')

    expect(screen.getByText('Sala 1')).toBeTruthy()
    expect(screen.getByText('Sala 2')).toBeTruthy()
    expect(screen.getByText('E-01 · ALESCO Modelo 2')).toBeTruthy()
    expect(screen.queryByText('E-03 · ALESCO Modelo 2')).toBeNull()
  })
})

describe('arrastar caixa', { timeout: 20_000 }, () => {
  it('soltar numa posição vazia manda a caixa para aquele endereço', () => {
    renderizar(<Estantes />, 'tecnico')

    arrastarF1AParaF1B()

    expect(mover).toHaveBeenCalledWith(
      { idCaixa: 10, idEstante: 1, face: 'frontal', linha: 1, coluna: 2 },
      expect.anything(),
    )
  })

  it('a vazia só se marca como destino durante o arraste', () => {
    renderizar(<Estantes />, 'tecnico')
    expect(vaziaF1B().className).not.toContain('posicao--destino')

    fireEvent.dragStart(caixaF1A(), { dataTransfer: dataTransfer() })
    expect(vaziaF1B().className).toContain('posicao--destino')

    fireEvent.dragEnd(caixaF1A())
    expect(vaziaF1B().className).not.toContain('posicao--destino')
  })

  it('soltar sem ter pegado caixa não move nada', () => {
    renderizar(<Estantes />, 'tecnico')

    fireEvent.drop(vaziaF1B(), { dataTransfer: dataTransfer() })

    expect(mover).not.toHaveBeenCalled()
  })

  it('enquanto grava, a caixa já aparece no lugar novo e a origem fica vazia', () => {
    renderizar(<Estantes />, 'tecnico')

    arrastarF1AParaF1B()

    expect(screen.getByRole('button', { name: /^F1B/ }).getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('button', { name: 'F1A' })).toHaveProperty('disabled', true)
  })

  it('avisa para onde a caixa foi quando a API grava', async () => {
    mover.mockImplementation((_dados, opcoes) => {
      opcoes.onSuccess({ idCaixa: 10, idEstante: 1, codigo: 'F1B' })
      opcoes.onSettled()
    })
    renderizar(<Estantes />, 'tecnico')

    arrastarF1AParaF1B()

    expect(await screen.findByText('Caixa F1A movida para F1B.')).toBeTruthy()
  })

  it('mostra a recusa da API e devolve a caixa para o lugar dela', async () => {
    mover.mockImplementation((_dados, opcoes) => {
      opcoes.onError(new Error('Esta posicao da estante ja tem uma caixa ativa.'))
      opcoes.onSettled()
    })
    renderizar(<Estantes />, 'tecnico')

    arrastarF1AParaF1B()

    expect(await screen.findByText('Esta posicao da estante ja tem uma caixa ativa.')).toBeTruthy()
    expect(caixaF1A().getAttribute('aria-busy')).toBe('false')
    expect(vaziaF1B()).toBeTruthy()
  })
})

describe('caixa de estoque na grade', { timeout: 20_000 }, () => {
  it('mostra o sexo e quantos animais tem, na cor da coluna', () => {
    renderizar(<Estantes />, 'tecnico')

    const celula = screen.getByRole('button', { name: /^F1C/ })

    expect(celula.textContent).toContain('♀ 4')
    expect(celula.className).toContain('posicao--reserva')
    expect(celula.getAttribute('title')).toContain(
      'caixa de estoque, 4 fêmeas, todos reservados (50 e 30 dias)',
    )
  })
})

describe('caixa de casal na grade', { timeout: 20_000 }, () => {
  it('mostra o parto em curso, o casal e quantos reservados a caixa tem, na cor de Livres', () => {
    renderizar(<Estantes />, 'tecnico')

    const celula = screen.getByRole('button', { name: /^F1D/ })

    expect(celula.textContent).toContain('2º')
    expect(celula.textContent).toContain('AB')
    expect(celula.textContent).toContain('2 res.')
    expect(celula.className).toContain('posicao--livres')
  })

  it('a caixa sem casal e a que não aparece no kanban ficam neutras', () => {
    renderizar(<Estantes />, 'tecnico')

    for (const codigo of [/^F1A/, /^F1E/]) {
      const celula = screen.getByRole('button', { name: codigo })
      expect(celula.className).not.toMatch(/posicao--(livres|estoque|reserva|enviado)/)
    }
  })
})
