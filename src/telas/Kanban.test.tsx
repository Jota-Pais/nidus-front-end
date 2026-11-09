import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CardDoKanban, CasalNoCard, EstoqueNoCard, Kanban as Quadro } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { Kanban } from './Kanban'

/** o casal do card; o que não vier é o de um casal ativo, sem reserva nem parto previsto */
const casal = (
  dados: Partial<CasalNoCard> & Pick<CasalNoCard, 'identificacao' | 'partoAtual'>,
): CasalNoCard => ({
  partoPrevisto: null,
  encerrado: false,
  aguardandoDesmame: false,
  ninhadas: [],
  reservado: 0,
  ...dados,
})

const estoque = (
  dados: Partial<EstoqueNoCard> & Pick<EstoqueNoCard, 'sexo' | 'total'>,
): EstoqueNoCard => ({
  idLinhagem: 1,
  reservado: 0,
  nascimentoDe: null,
  nascimentoAte: null,
  grupos: [],
  ...dados,
})

const card = (idCaixa: number, dados: Partial<CardDoKanban> = {}): CardDoKanban => ({
  idCaixa,
  codigo: `F1${String.fromCharCode(64 + idCaixa)}`,
  numeroVisivel: 'E-01',
  linhagem: 'Wistar',
  casal: null,
  estoque: null,
  ...dados,
})

const quadro: Quadro = {
  colunas: [
    {
      estado: 'livres',
      cards: [
        card(1, {
          casal: casal({
            identificacao: 'AB',
            partoAtual: 2,
            partoPrevisto: '2026-11-20',
            ninhadas: [
              { casal: 'AB', parto: 1, m: 1, f: 0, idadeDias: 30, mamando: false },
              { casal: 'AB', parto: 2, m: 2, f: 0, idadeDias: 0, mamando: true },
            ],
            reservado: 3,
          }),
        }),
        card(2, { casal: casal({ identificacao: 'BC', partoAtual: 5, encerrado: true }) }),
        card(3, {
          casal: casal({
            identificacao: 'CD',
            partoAtual: 2,
            encerrado: true,
            aguardandoDesmame: true,
            ninhadas: [{ casal: 'CD', parto: 2, m: 4, f: 4, idadeDias: 12, mamando: true }],
          }),
        }),
        card(4),
        card(5, { casal: casal({ identificacao: 'DE', partoAtual: 5 }) }),
        // casal novo numa caixa onde o casal encerrado deixou a ninhada do 5º parto
        card(6, {
          casal: casal({
            identificacao: 'EA',
            partoAtual: 1,
            partoPrevisto: '2026-11-30',
            ninhadas: [{ casal: 'DE', parto: 5, m: 3, f: 4, idadeDias: 25, mamando: false }],
          }),
        }),
      ],
    },
    {
      estado: 'estoque',
      cards: [
        card(7, {
          codigo: 'F2C',
          estoque: estoque({
            sexo: 'M',
            total: 6,
            reservado: 2,
            grupos: [
              { dtNascimento: '2026-09-20', idadeDias: 50, total: 2, reservados: 2 },
              { dtNascimento: '2026-10-10', idadeDias: 30, total: 4, reservados: 0 },
            ],
          }),
        }),
      ],
    },
    {
      estado: 'enviado',
      cards: [card(8, { codigo: 'F2D', estoque: estoque({ sexo: 'F', total: 0 }) })],
    },
  ],
}

vi.mock('@/dominio/consultas', () => ({
  useKanban: () => consulta(quadro),
  useFicha: () => ({ data: undefined, isPending: false, error: null }),
}))

// a ficha tem as consultas dela; aqui ela fica fechada e não importa
vi.mock('./FichaDaCaixa', () => ({ FichaDaCaixa: () => null }))

const cardDe = (codigo: string) => screen.getByText(codigo).closest('.kanban__card')

describe('card do casal', () => {
  it('mostra o parto em curso ao lado da bolinha e a previsão dele', () => {
    renderizar(<Kanban />)

    const cardAB = cardDe('F1A')
    expect(cardAB?.textContent).toContain('2º')
    expect(cardAB?.textContent).toContain('P: 20/11')
  })

  it('sem parto pendente, não mostra previsão', () => {
    renderizar(<Kanban />)

    expect(cardDe('F1B')?.textContent).not.toContain('P:')
  })

  it('casal ativo no 5º parto avisa o último parto; encerrado, no 5º ou antes, diz casal encerrado', () => {
    renderizar(<Kanban />)

    expect(screen.getAllByText(/Último parto/)).toHaveLength(1)
    expect(screen.getAllByText(/Casal encerrado/)).toHaveLength(2)
    expect(screen.getAllByText(/Aguardando desmame/)).toHaveLength(1)
  })

  it('mostra os vivos de cada ninhada, a idade de hoje e quem ainda mama', () => {
    renderizar(<Kanban />)

    const [ninhadas] = screen.getAllByRole('list', { name: 'Animais na caixa' })
    expect(ninhadas?.textContent).toContain('1 M · 0 F30 dias')
    expect(ninhadas?.textContent).toContain('2 M · 0 F0 dias · mamando')
    expect(ninhadas?.textContent).not.toContain('30 dias · mamando')
  })

  it('casal novo não esconde a ninhada que o casal encerrado deixou na caixa', () => {
    renderizar(<Kanban />)

    const listas = screen.getAllByRole('list', { name: 'Animais na caixa' })
    expect(listas.at(-1)?.textContent).toContain('DE 5º3 M · 4 F25 dias')
  })

  it('a caixa do casal com animais reservados fica em Livres e diz quantos', () => {
    renderizar(<Kanban />)

    expect(cardDe('F1A')?.textContent).toContain('Casal ativo · 3 reservados')
    // só o card do casal que tem reserva: os outros não falam de reservados
    expect(screen.getAllByText(/^· \d+ reservados?$/)).toHaveLength(1)
  })

  it('só tem as quatro colunas: não existe Pré-reserva', () => {
    renderizar(<Kanban />)

    expect(
      screen.getAllByRole('region').map((coluna) => coluna.getAttribute('aria-label')),
    ).toEqual(['Livres: 6 caixas', 'Estoque: 1 caixas', 'Reserva: 0 caixas', 'Enviado: 1 caixas'])
    expect(screen.queryByText(/Pré-reserva/)).toBeNull()
  })

  it('caixa livre sem casal diz que não tem casal ativo', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('Sem casal ativo')).toBeTruthy()
  })
})

describe('card da caixa de estoque', () => {
  it('mostra o sexo, quantos animais tem e quantos estão reservados', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('♂ 6')).toBeTruthy()
    expect(screen.getByText('6 machos, 2 reservados')).toBeTruthy()
    expect(screen.getByText('Animais de estoque')).toBeTruthy()
  })

  it('mostra as idades por data de nascimento, do mais velho ao mais novo, com os reservados de cada', () => {
    renderizar(<Kanban />)

    const idades = screen.getByRole('list', { name: 'Idades na caixa' })
    expect([...idades.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      '50 dias2 · 2 res.',
      '30 dias4',
    ])
  })

  it('a enviada mostra o endereço entre parênteses e nenhum animal: a posição já ficou livre', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('(F2D)')).toBeTruthy()
    expect(cardDe('(F2D)')?.textContent).not.toContain('fêmeas')
  })

  it('nenhum card se arrasta: o kanban é só de leitura', () => {
    renderizar(<Kanban />)

    expect(cardDe('F2C')?.hasAttribute('draggable')).toBe(false)
    expect(cardDe('F1A')?.hasAttribute('draggable')).toBe(false)
  })
})
