import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ESTADO_CAIXA } from '@/dominio/estados'
import type { CardDoQuadro } from '@/dominio/quadro'
import type { EstadoCaixa } from '@/dominio/tipos'
import { CardDaCaixa } from './index'

function card(sobrescrever: Partial<CardDoQuadro> = {}): CardDoQuadro {
  return {
    idCaixa: 812,
    codigo: 'A1',
    numeroVisivel: 'E-03',
    sala: 'Sala 1',
    linhagem: 'Wistar',
    casal: { id: 44, identificacao: 'AB', cicloAtual: 3, maxCiclos: 5 },
    disponivel: { m: 2, f: 4 },
    grauCerteza: 'previsto',
    proximoEvento: { tipo: 'desmame_previsto', data: '2026-09-21', atrasado: false },
    ...sobrescrever,
  }
}

describe('CardDaCaixa — RF-CIC-04, o que precisa estar visível no card', () => {
  it('mostra posição, estante, linhagem, casal e ciclo', () => {
    render(<CardDaCaixa card={card()} estado="parcialmente_comprometida" />)

    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('E-03')).toBeInTheDocument()
    expect(screen.getByText('Wistar')).toBeInTheDocument()
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  /**
   * RN-09 - o pesquisador pede por sexo e o motor atende por sexo. Um total de
   * "6 animais" faria uma caixa com 2 machos parecer capaz de atender um pedido
   * de 5 machos
   */
  it('conta por sexo e nunca soma os dois num total', () => {
    render(<CardDaCaixa card={card()} estado="em_reproducao" />)

    expect(screen.getByLabelText('2 machos e 4 fêmeas')).toBeInTheDocument()
    expect(screen.queryByText('6')).not.toBeInTheDocument()
  })

  it('sem casal ativo, diz isso em vez de deixar o espaço em branco', () => {
    render(<CardDaCaixa card={card({ casal: null })} estado="expedida" />)
    expect(screen.getByText('Sem casal ativo')).toBeInTheDocument()
  })
})

describe('CardDaCaixa — RNF-10, nada só por cor', () => {
  const estados = Object.keys(ESTADO_CAIXA) as EstadoCaixa[]

  it.each(estados)('o estado %s carrega marcador e sigla no card', (estado) => {
    render(<CardDaCaixa card={card()} estado={estado} />)

    expect(screen.getByText(ESTADO_CAIXA[estado].marcador)).toBeInTheDocument()
    expect(screen.getByText(ESTADO_CAIXA[estado].sigla)).toBeInTheDocument()
  })

  it('os cinco estados continuam distinguíveis sem enxergar a cor', () => {
    const marcas = estados.map((estado) => {
      const { unmount } = render(<CardDaCaixa card={card()} estado={estado} />)
      const marca = `${ESTADO_CAIXA[estado].marcador}${ESTADO_CAIXA[estado].sigla}`
      unmount()
      return marca
    })

    expect(new Set(marcas).size).toBe(estados.length)
  })

  it('o card inteiro tem leitura por extenso para leitor de tela', () => {
    render(<CardDaCaixa card={card()} estado="parcialmente_comprometida" aoAbrir={vi.fn()} />)

    const botao = screen.getByRole('button')
    expect(botao).toHaveAccessibleName(/Posição A1 na estante E-03, Sala 1/)
    expect(botao).toHaveAccessibleName(/Parcialmente comprometida/)
    expect(botao).toHaveAccessibleName(/disponível 2 machos e 4 fêmeas/)
  })
})

describe('CardDaCaixa — RF-REP-07, previsão vencida precisa gritar', () => {
  const atrasado = card({
    proximoEvento: { tipo: 'desmame_previsto', data: '2026-08-01', atrasado: true },
  })

  it('anuncia o atraso como estado, não como enfeite', () => {
    render(<CardDaCaixa card={atrasado} estado="em_reproducao" />)
    expect(screen.getByRole('status')).toHaveAccessibleName(/Vencido sem confirmação/)
  })

  it('caixa em dia não mostra a marca de atraso', () => {
    render(<CardDaCaixa card={card()} estado="em_reproducao" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('CardDaCaixa — RF-CIC-02, abre a mesma ficha da grade', () => {
  it('devolve o id da caixa ao clicar', async () => {
    const abrir = vi.fn()
    render(<CardDaCaixa card={card()} estado="em_reproducao" aoAbrir={abrir} />)

    await userEvent.click(screen.getByRole('button'))
    expect(abrir).toHaveBeenCalledExactlyOnceWith(812)
  })

  it('sem `aoAbrir`, o card não finge ser clicável', () => {
    render(<CardDaCaixa card={card()} estado="em_reproducao" />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
