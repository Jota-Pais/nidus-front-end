import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Catalogo, Estante, Grade } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
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
          caixa: {
            id: 10,
            fase: null,
            atrasado: false,
            idLinhagem: 1,
            linhagem: 'Wistar',
            casal: null,
            estoque: null,
          },
        },
        { linha: 1, coluna: 2, codigo: 'F1B', caixa: null },
        {
          linha: 1,
          coluna: 3,
          codigo: 'F1C',
          caixa: {
            id: 11,
            fase: 'estoque',
            atrasado: false,
            idLinhagem: 1,
            linhagem: 'Wistar',
            casal: null,
            estoque: {
              sexo: 'F',
              idLinhagem: 1,
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
            fase: 'pronto_estoque',
            atrasado: false,
            idLinhagem: 2,
            linhagem: 'SHR',
            casal: {
              identificacao: 'AB',
              partoAtual: 2,
              partoDaFase: 2,
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
          caixa: {
            id: 13,
            fase: null,
            atrasado: false,
            idLinhagem: 1,
            linhagem: 'Wistar',
            casal: null,
            estoque: null,
          },
        },
        // só o casal, com o parto previsto para 01/11 sem nascimento registrado
        {
          linha: 2,
          coluna: 1,
          codigo: 'F2A',
          caixa: {
            id: 14,
            fase: 'acasalado',
            atrasado: true,
            idLinhagem: 2,
            linhagem: 'SHR',
            casal: {
              identificacao: 'CD',
              partoAtual: 1,
              partoDaFase: 1,
              partoPrevisto: '2026-11-01',
              encerrado: false,
              aguardandoDesmame: false,
              ninhadas: [],
              reservado: 0,
            },
            estoque: null,
          },
        },
      ],
    },
  ],
}

const catalogo: Catalogo = {
  especies: [
    {
      id: 1,
      codigo: 'rato',
      nome: 'Rato',
      linhagens: [
        { id: 1, nome: 'Wistar', ativa: true, cruzamento: 'rodizio' },
        { id: 2, nome: 'SHR', ativa: true, cruzamento: 'mesma_letra' },
      ],
    },
  ],
}

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta(catalogo),
  useEstantes: () => consulta([estante(1, 'Sala 1', 'E-01'), estante(2, 'Sala 2', 'E-03')]),
  useGrade: () => consulta(grade),
  useCaixasLiberadas: () => consulta({ caixas: [], temMais: false }),
  useMudarDePosicao: () => ({ mutate: mover, isPending: false }),
  useSalas: () => consulta([{ id: 1, nome: 'Sala 1', estantes: 1 }]),
  useSalvarEstante: () => ({ mutate: vi.fn(), isPending: false }),
}))

// a ficha tem as consultas dela; aqui ela fica fechada e não importa
vi.mock('./FichaDaCaixa', () => ({ FichaDaCaixa: () => null }))

// a janela dos formatos tem os testes dela: aqui basta saber que abriu
vi.mock('./FormatosDeEstante', () => ({
  FormatosDeEstante: () => <div>janela dos formatos</div>,
}))

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
  it('o gestor cadastra estante pela grade, no mesmo formulário dos Cadastros', async () => {
    renderizar(<Estantes />, 'gestor')

    fireEvent.click(screen.getByRole('button', { name: 'Nova estante' }))

    expect(await screen.findByRole('dialog', { name: 'Nova estante' })).toBeTruthy()
  })

  it('o técnico não vê o botão Nova estante', () => {
    renderizar(<Estantes />, 'tecnico')

    expect(screen.queryByRole('button', { name: 'Nova estante' })).toBeNull()
  })

  it.each(['tecnico', 'gestor'] as const)('o %s abre a janela dos formatos', (perfil) => {
    renderizar(<Estantes />, perfil)
    expect(screen.queryByText('janela dos formatos')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Formatos/ }))

    expect(screen.getByText('janela dos formatos')).toBeTruthy()
  })

  it.each(['tecnico', 'gestor'] as const)('o %s tem o botão Histórico, que abre as caixas liberadas', async (perfil) => {
    renderizar(<Estantes />, perfil)

    expect(screen.queryByRole('dialog', { name: 'Histórico das estantes' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Histórico/ }))

    expect(await screen.findByRole('dialog', { name: 'Histórico das estantes' })).toBeTruthy()
  })

  it('o pesquisador não vê os botões Histórico e Formatos', () => {
    renderizar(<Estantes />, 'pesquisador')

    expect(screen.queryByRole('button', { name: /Histórico/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Formatos/ })).toBeNull()
  })

  it('não tem a descrição embaixo do título', () => {
    renderizar(<Estantes />, 'tecnico')

    expect(screen.queryByText(/As duas faces de cada estante/)).toBeNull()
  })

  it('continua separando as estantes por sala, pelo nome que vem na estante', () => {
    renderizar(<Estantes />, 'tecnico')

    expect(screen.getByText('Sala 1')).toBeTruthy()
    expect(screen.getByText('Sala 2')).toBeTruthy()
    expect(screen.getByText('E-01 · ALESCO Modelo 2')).toBeTruthy()
    expect(screen.queryByText('E-03 · ALESCO Modelo 2')).toBeNull()
  })
})

describe('no celular', { timeout: 20_000 }, () => {
  it('Histórico e Formatos ficam só com o ícone, com o nome no título, e Nova estante com o texto', () => {
    const voltar = larguraDaTela(390)

    try {
      renderizar(<Estantes />, 'gestor')

      for (const nome of ['Histórico', 'Formatos']) {
        const botao = screen.getByRole('button', { name: nome })
        expect(botao.getAttribute('title')).toBe(nome)
        expect(botao.textContent).toBe('')
      }
      expect(screen.getByRole('button', { name: 'Nova estante' }).textContent).toBe('Nova estante')
    } finally {
      voltar()
    }
  })

  it('as colunas cabem na largura, ninguém arrasta e a legenda fica atrás de um botão', () => {
    const voltar = larguraDaTela(390)

    try {
      renderizar(<Estantes />)

      // o arrastar do navegador não funciona no toque: a caixa muda de lugar pela ficha
      expect(caixaF1A().getAttribute('draggable')).toBe('false')
      // as 5 colunas da estante dividem a largura, sem rolar de lado
      const grade = caixaF1A().closest<HTMLElement>('.face__grade')
      expect(grade?.style.gridTemplateColumns).toBe('repeat(5, minmax(44px, 1fr))')
      expect(screen.queryByText(/arraste/)).toBeNull()

      expect(screen.queryByText('Fases')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /Legenda/ }))
      expect(screen.getByText('Fases')).toBeTruthy()
    } finally {
      voltar()
    }
  })

  it('no computador a caixa continua arrastável e a legenda aberta', () => {
    renderizar(<Estantes />)

    expect(caixaF1A().getAttribute('draggable')).toBe('true')
    expect(screen.getByText('Fases')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Legenda/ })).toBeNull()
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

    expect(await screen.findByText('Caixa mudou de lugar: de F1A para F1B.')).toBeTruthy()
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
  it('mostra o sexo e quantos animais tem, na cor do estoque', () => {
    renderizar(<Estantes />, 'tecnico')

    const celula = screen.getByRole('button', { name: /^F1C/ })

    expect(celula.textContent).toContain('♀ 4')
    expect(celula.className).toContain('posicao--estoque')
    expect(celula.className).not.toContain('posicao--atrasado')
    expect(celula.getAttribute('title')).toContain(
      'caixa de estoque, 4 fêmeas, todas reservadas (50 e 30 dias)',
    )
  })
})

describe('caixa de casal na grade', { timeout: 20_000 }, () => {
  it('mostra o parto em curso, o casal e quantos reservados a caixa tem, na cor da fase', () => {
    renderizar(<Estantes />, 'tecnico')

    const celula = screen.getByRole('button', { name: /^F1D/ })

    expect(celula.textContent).toContain('2º')
    expect(celula.textContent).toContain('AB')
    expect(celula.textContent).toContain('2 res.')
    // os desmamados do 1º parto continuam na caixa do casal
    expect(celula.className).toContain('posicao--pronto_estoque')
    expect(celula.getAttribute('title')).toContain('desmamados, prontos para o estoque')
  })

  it('a caixa acasalada mostra a data do parto, e o atraso vem na borda e no título', () => {
    renderizar(<Estantes />, 'tecnico')

    const celula = screen.getByRole('button', { name: /^F2A/ })

    expect(celula.textContent).toContain('parto 01/11')
    expect(celula.className).toContain('posicao--acasalado')
    expect(celula.className).toContain('posicao--atrasado')
    expect(celula.getAttribute('title')).toContain(
      'Atrasado: o parto previsto para 01/11 não foi registrado',
    )
  })

  it('a legenda diz o que cada cor de fundo é, e que a borda vermelha é o atraso', () => {
    renderizar(<Estantes />, 'tecnico')

    for (const rotulo of [
      'Acasalado',
      'Em aleitamento',
      'Pronto para o estoque',
      'Estoque',
      'Atrasado',
    ]) {
      expect(screen.getByText(rotulo)).toBeTruthy()
    }
  })

  it('a caixa sem fase fica neutra', () => {
    renderizar(<Estantes />, 'tecnico')

    for (const codigo of [/^F1A/, /^F1E/]) {
      const celula = screen.getByRole('button', { name: codigo })
      expect(celula.className).not.toMatch(/posicao--(acasalado|mamando|pronto_estoque|estoque)/)
    }
  })
})

describe('só uma linhagem, vindo da Visão geral', { timeout: 20_000 }, () => {
  const apagadas = () =>
    [...document.querySelectorAll('.posicao--apagada')].map(
      (celula) => celula.querySelector('.posicao__codigo')?.textContent,
    )

  it('sem linhagem no endereço, nada fica apagado', () => {
    renderizar(<Estantes />, 'tecnico')

    expect(apagadas()).toEqual([])
    expect(screen.queryByRole('button', { name: 'Mostrar todas as linhagens' })).toBeNull()
  })

  it('apaga as caixas das outras linhagens e as vazias, e diz qual está acesa', () => {
    renderizar(<Estantes />, 'tecnico', 'Teste', '/estantes?linhagem=2')

    expect(screen.getByText('Só a linhagem SHR')).toBeTruthy()
    expect(apagadas()).toEqual(['F1A', 'F1B', 'F1C', 'F1E'])
    expect(screen.getByRole('button', { name: /^F1D/ }).className).not.toContain('posicao--apagada')
  })

  it('o botão do filtro volta a mostrar todas', () => {
    renderizar(<Estantes />, 'tecnico', 'Teste', '/estantes?linhagem=2')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar todas as linhagens' }))

    expect(apagadas()).toEqual([])
    expect(screen.queryByText('Só a linhagem SHR')).toBeNull()
  })
})
