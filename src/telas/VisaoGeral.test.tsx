import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LinhagemNaVisaoGeral, VisaoGeral as DadosDaVisao } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { VisaoGeral } from './VisaoGeral'

const faixas: LinhagemNaVisaoGeral['livresPorIdade'] = []

const nada = { m: 0, f: 0 }

const dados: DadosDaVisao = {
  especies: [
    {
      codigo: 'rato',
      nome: 'Rato',
      linhagens: [
        {
          idLinhagem: 1,
          linhagem: 'Wistar',
          casais: 2,
          vivos: { m: 15, f: 16 },
          mamando: { m: 3, f: 2 },
          reservados: { m: 4, f: 3 },
          livres: { m: 11, f: 13 },
          livresPorIdade: faixas,
          livresPorIdadeDias: [
            { idade: 0, m: 3, f: 2 },
            { idade: 14, m: 4, f: 5 },
            { idade: 38, m: 5, f: 4 },
            { idade: 60, m: 3, f: 5 },
            { idade: 75, m: 1, f: 1 },
          ],
          aleitamento: { nascidos: 75, ajusteDeNinhada: 6, mortesNoAleitamento: 3 },
        },
        {
          idLinhagem: 2,
          linhagem: 'SHR',
          casais: 1,
          vivos: { m: 6, f: 5 },
          mamando: { m: 3, f: 3 },
          reservados: nada,
          livres: { m: 6, f: 5 },
          livresPorIdade: faixas,
          livresPorIdadeDias: [
            { idade: 21, m: 3, f: 3 },
            { idade: 40, m: 3, f: 2 },
          ],
          aleitamento: { nascidos: 200, ajusteDeNinhada: 0, mortesNoAleitamento: 1 },
        },
        {
          // 10 idades distintas: o gráfico agrupa por semana
          idLinhagem: 3,
          linhagem: 'LEW',
          casais: 1,
          vivos: { m: 10, f: 20 },
          mamando: nada,
          reservados: nada,
          livres: { m: 10, f: 20 },
          livresPorIdade: faixas,
          livresPorIdadeDias: Array.from({ length: 10 }, (_, i) => ({ idade: i + 1, m: 1, f: 2 })),
          // só do cadastro inicial: nenhum nascido em parto registrado
          aleitamento: { nascidos: 0, ajusteDeNinhada: 0, mortesNoAleitamento: 0 },
        },
        {
          // a API antiga não manda o campo novo: conta como sem livres
          idLinhagem: 4,
          linhagem: 'Sprague',
          casais: 0,
          vivos: nada,
          mamando: nada,
          reservados: nada,
          livres: nada,
          livresPorIdade: faixas,
        },
      ],
    },
    { codigo: 'camundongo', nome: 'Camundongo', linhagens: [] },
  ],
}

vi.mock('@/dominio/consultas', () => ({ useVisaoGeral: () => consulta(dados) }))

/** A tabela de números de uma espécie */
const tabelaDe = (especie: string) =>
  screen.getByRole('table', { name: `Números de ${especie} por linhagem` })

/** As células de uma linha da tabela (casais, em aleitamento, reservados, livres) */
const celulas = (linha: Element) => [...linha.querySelectorAll('td')].map((td) => td.textContent)

/** A linha de uma linhagem na tabela, pelo link do nome */
const linhaDa = (nome: string) =>
  within(tabelaDe('Ratos')).getByRole('link', { name: nome }).closest('tr')!

/** O cartão do gráfico de uma linhagem, pelo link do nome */
const cartaoDa = (nome: string) =>
  within(screen.getByRole('list', { name: 'Linhagens de Ratos' }))
    .getByRole('link', { name: nome })
    .closest('li')!

/** Os números em cima das barras do cartão, na ordem em que o gráfico os desenha */
const rotulosDeValor = (cartao: HTMLElement) =>
  [...cartao.querySelectorAll('.visao__valorDaBarra')].map((texto) => texto.textContent)

describe('Visão geral', { timeout: 20_000 }, () => {
  it('mostra os números numa tabela: uma linha por linhagem e o total da espécie', () => {
    renderizar(<VisaoGeral />)

    const tabela = tabelaDe('Ratos')
    expect([...tabela.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Linhagem',
      'Casais ativos',
      'Em aleitamento',
      'Reservados',
      'Livres',
    ])
    expect(celulas(linhaDa('Wistar'))).toEqual(['2', '♂ 3♀ 2', '♂ 4♀ 3', '♂ 11♀ 13'])
    expect(celulas(linhaDa('SHR'))).toEqual(['1', '♂ 3♀ 3', '♂ 0♀ 0', '♂ 6♀ 5'])
    // a linhagem sem nada aparece zerada
    expect(celulas(linhaDa('Sprague'))).toEqual(['0', '♂ 0♀ 0', '♂ 0♀ 0', '♂ 0♀ 0'])

    // o total soma as linhagens
    const total = tabela.querySelector('tfoot tr')!
    expect(total.querySelector('th')!.textContent).toBe('Total')
    expect(celulas(total)).toEqual(['4', '♂ 6♀ 5', '♂ 4♀ 3', '♂ 27♀ 38'])
  })

  it('o nome da linhagem na tabela leva às estantes', () => {
    renderizar(<VisaoGeral />)

    expect(
      within(linhaDa('Wistar')).getByRole('link', { name: 'Wistar' }).getAttribute('href'),
    ).toBe('/estantes?linhagem=1')
  })

  it('faz um gráfico de livres por idade por linhagem, com o nome levando às estantes', () => {
    renderizar(<VisaoGeral />)

    const lista = screen.getByRole('list', { name: 'Linhagens de Ratos' })
    expect(lista.querySelectorAll(':scope > li')).toHaveLength(4)

    const wistar = cartaoDa('Wistar')
    expect(within(wistar).getByRole('link', { name: 'Wistar' }).getAttribute('href')).toBe(
      '/estantes?linhagem=1',
    )
    // os números ficam na tabela: o cartão tem só o nome e o gráfico
    expect(wistar.querySelector('header')!.textContent).toBe('Wistar')
    expect(wistar.querySelector('dl')).toBeNull()
  })

  it('escreve em cima de cada barra o número de machos e de fêmeas de cada idade', () => {
    renderizar(<VisaoGeral />)

    const wistar = cartaoDa('Wistar')
    // as barras dos machos e depois as das fêmeas, uma por idade (0, 14, 38, 60 e 75 dias)
    expect(rotulosDeValor(wistar)).toEqual(['3', '4', '5', '3', '1', '2', '5', '4', '5', '1'])

    const grafico = within(wistar).getByRole('img')
    const descricao = grafico.getAttribute('aria-label')!
    expect(descricao).toContain('0 dias: 3 machos, 2 fêmeas')
    expect(descricao).toContain('38 dias: 5 machos, 4 fêmeas')
    expect(descricao).toContain('75 dias: 1 macho, 1 fêmea')
    for (const idade of ['0 d', '14 d', '38 d', '60 d', '75 d']) {
      expect(within(wistar).getByText(idade)).toBeTruthy()
    }
  })

  it('agrupa por semana quando a linhagem tem mais de 8 idades', () => {
    renderizar(<VisaoGeral />)

    const lew = cartaoDa('LEW')
    expect(within(lew).getByText('0–6 d')).toBeTruthy()
    expect(within(lew).getByText('7–13 d')).toBeTruthy()
    expect(within(lew).getByRole('img').getAttribute('aria-label')).toContain(
      '0–6 dias: 6 machos, 12 fêmeas; 7–13 dias: 4 machos, 8 fêmeas',
    )
    // a SHR, com 2 idades, fica nas idades de verdade
    expect(within(cartaoDa('SHR')).getByText('21 d')).toBeTruthy()
  })

  it('a linhagem sem livres mostra um vazio curto no lugar do gráfico', () => {
    renderizar(<VisaoGeral />)

    const sprague = cartaoDa('Sprague')
    expect(within(sprague).getByText('Sem animais livres.')).toBeTruthy()
    expect(within(sprague).queryByRole('img')).toBeNull()
  })

  it('mostra embaixo da tabela as baixas do aleitamento desde o início, sobre os nascidos', () => {
    renderizar(<VisaoGeral />)

    // uma linha só, a da espécie: os cartões das linhagens não a repetem
    const linhas = document.querySelectorAll('.visao__aleitamento')
    expect(linhas).toHaveLength(1)
    // os totais da espécie somam as linhagens: 6 e 4 em 275 nascidos
    expect(linhas[0]!.textContent).toBe(
      'Desde o início: Ajuste de ninhada 6 (2% dos nascidos) · Mortes no aleitamento 4 (1% dos nascidos) · 275 nascidos em partos registrados',
    )
    expect(cartaoDa('Wistar').querySelector('.visao__aleitamento')).toBeNull()
  })

  it('mostra a rosca da situação e as barras de vivos por linhagem', () => {
    renderizar(<VisaoGeral />)

    const rosca = screen.getByRole('region', { name: 'Situação dos vivos de Ratos' })
    expect(within(rosca).getByRole('img').getAttribute('aria-label')).toBe(
      'Situação dos vivos: 7 reservados, 65 livres',
    )
    expect(within(rosca).getByText('72')).toBeTruthy()

    const barras = screen.getByRole('region', { name: 'Vivos por linhagem de Ratos' })
    expect(within(barras).getByRole('img').getAttribute('aria-label')).toContain(
      'Wistar 31 (7 reservados, 24 livres)',
    )
  })

  it('a espécie sem linhagem aparece, só com o aviso', () => {
    renderizar(<VisaoGeral />)

    expect(screen.getByText('Camundongos')).toBeTruthy()
    expect(screen.getByText('Nenhuma linhagem nesta espécie.')).toBeTruthy()
    expect(screen.queryByRole('table', { name: 'Números de Camundongos por linhagem' })).toBeNull()
  })
})

describe('Visão geral no celular', { timeout: 20_000 }, () => {
  it('mantém a tabela, os gráficos e o link de cada linhagem', () => {
    const voltar = larguraDaTela(390)
    try {
      renderizar(<VisaoGeral />)

      expect(celulas(linhaDa('SHR'))).toEqual(['1', '♂ 3♀ 3', '♂ 0♀ 0', '♂ 6♀ 5'])

      const shr = cartaoDa('SHR')
      expect(within(shr).getByRole('link', { name: 'SHR' }).getAttribute('href')).toBe(
        '/estantes?linhagem=2',
      )
      expect(rotulosDeValor(shr)).toEqual(['3', '3', '3', '2'])
      expect(within(shr).getByRole('img').getAttribute('aria-label')).toContain(
        '40 dias: 3 machos, 2 fêmeas',
      )
    } finally {
      voltar()
    }
  })
})
