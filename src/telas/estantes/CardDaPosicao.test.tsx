import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ESTADO_CAIXA } from '@/dominio/estados'
import type { Posicao } from '@/dominio/estante'
import type { EstadoCaixa } from '@/dominio/tipos'
import { CardDaPosicao } from './CardDaPosicao'

function posicao(sobrescrever: Partial<Posicao> = {}): Posicao {
  return {
    linha: 1,
    coluna: 1,
    codigo: 'A1',
    caixa: {
      id: 812,
      especie: 'rato',
      linhagem: 'Wistar',
      finalidade: 'reproducao',
      estado: 'parcialmente_comprometida',
      casal: { id: 44, identificacao: 'AB', cicloAtual: 3, maxCiclos: 5 },
      proximoEvento: { tipo: 'desmame_previsto', data: '2026-09-21', atrasado: false },
    },
    ...sobrescrever,
  }
}

describe('CardDaPosicao — o que o card do backlog pede no card', () => {
  it('mostra código, linhagem, identificação do casal e ciclo', () => {
    render(<CardDaPosicao posicao={posicao()} aoAbrir={vi.fn()} />)
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('Wistar')).toBeInTheDocument()
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('abre a ficha da caixa ao clicar', () => {
    const aoAbrir = vi.fn()
    render(<CardDaPosicao posicao={posicao()} aoAbrir={aoAbrir} />)
    screen.getByRole('button').click()
    expect(aoAbrir).toHaveBeenCalledWith(812)
  })

  it('posição vazia não é clicável e se anuncia como vazia', () => {
    render(<CardDaPosicao posicao={posicao({ caixa: null })} aoAbrir={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/posição vazia/i)).toBeInTheDocument()
  })
})

describe('CardDaPosicao — RNF-10, nada só por cor', () => {
  const estados = Object.keys(ESTADO_CAIXA) as EstadoCaixa[]

  it('cada um dos 5 estados mostra marcador e sigla, distinguíveis sem cor', () => {
    const vistos = new Set<string>()

    for (const estado of estados) {
      const { unmount } = render(
        <CardDaPosicao posicao={posicao({ caixa: { ...posicao().caixa!, estado } })} aoAbrir={vi.fn()} />,
      )
      const visual = ESTADO_CAIXA[estado]
      expect(screen.getByText(visual.sigla)).toBeInTheDocument()
      expect(screen.getByText(visual.marcador)).toBeInTheDocument()
      vistos.add(`${visual.marcador}|${visual.sigla}`)
      unmount()
    }

    // Simulando deuteranopia ou impressão em P&B, a combinação marcador+sigla
    // é o que resta — e ela tem que ser única por estado.
    expect(vistos.size).toBe(estados.length)
  })

  it('o aria-label traz o rótulo por extenso, não a sigla', () => {
    render(<CardDaPosicao posicao={posicao()} aoAbrir={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAccessibleName(
      /Parcialmente comprometida/,
    )
  })

  it('o aria-label descreve casal, ciclo e próximo evento com data dd/mm/aaaa', () => {
    render(<CardDaPosicao posicao={posicao()} aoAbrir={vi.fn()} />)
    const nome = screen.getByRole('button').getAttribute('aria-label') ?? ''
    expect(nome).toContain('casal AB')
    expect(nome).toContain('ciclo 3 de 5')
    expect(nome).toContain('21/09/2026')
  })
})

describe('CardDaPosicao — RF-REP-07, previsão vencida precisa gritar', () => {
  const atrasada = posicao({
    caixa: {
      ...posicao().caixa!,
      proximoEvento: { tipo: 'desmame_previsto', data: '2026-08-20', atrasado: true },
    },
  })

  it('anuncia o vencimento no nome acessível, não só na cor da borda', () => {
    render(<CardDaPosicao posicao={atrasada} aoAbrir={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAccessibleName(/vencido sem confirmação/)
  })

  it('marca a posição com a classe de atraso, que é a borda e o ícone', () => {
    render(<CardDaPosicao posicao={atrasada} aoAbrir={vi.fn()} />)
    expect(screen.getByRole('button').className).toContain('posicao--atrasada')
  })

  it('não marca quando a previsão está em dia', () => {
    render(<CardDaPosicao posicao={posicao()} aoAbrir={vi.fn()} />)
    expect(screen.getByRole('button').className).not.toContain('posicao--atrasada')
  })
})
