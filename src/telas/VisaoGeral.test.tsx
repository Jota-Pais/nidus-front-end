import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LinhagemNaVisaoGeral, VisaoGeral as DadosDaVisao } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { VisaoGeral } from './VisaoGeral'

const faixas = (...livres: [number, number][]): LinhagemNaVisaoGeral['livresPorIdade'] =>
  [
    { de: 0, ate: 21 },
    { de: 22, ate: 35 },
    { de: 36, ate: 60 },
    { de: 61, ate: null },
  ].map((faixa, indice) => ({ ...faixa, m: livres[indice]![0], f: livres[indice]![1] }))

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
          livresPorIdade: faixas([3, 2], [5, 6], [3, 5], [0, 0]),
        },
        {
          idLinhagem: 2,
          linhagem: 'SHR',
          casais: 1,
          vivos: { m: 6, f: 5 },
          mamando: { m: 3, f: 3 },
          reservados: { m: 0, f: 0 },
          livres: { m: 6, f: 5 },
          livresPorIdade: faixas([3, 3], [3, 2], [0, 0], [0, 0]),
        },
      ],
    },
    { codigo: 'camundongo', nome: 'Camundongo', linhagens: [] },
  ],
}

vi.mock('@/dominio/consultas', () => ({ useVisaoGeral: () => consulta(dados) }))

/** O valor de um dado do placar da espécie, pelo rótulo */
const noPlacar = (especie: string, rotulo: string) => {
  const dt = within(screen.getByLabelText(`Totais de ${especie}`)).getByText(rotulo)
  return dt.closest('.visao__dado')!.querySelector('dd')!.textContent
}

describe('Visão geral', { timeout: 20_000 }, () => {
  it('soma as linhagens no placar da espécie', () => {
    renderizar(<VisaoGeral />)

    expect(noPlacar('Ratos', 'Vivos')).toBe('♂21♀2111 mamando')
    expect(noPlacar('Ratos', 'Reservados')).toBe('♂4♀3')
    expect(noPlacar('Ratos', 'Livres')).toBe('♂17♀18')
    expect(noPlacar('Ratos', 'Casais')).toBe('3 ativos')
  })

  it('mostra cada linhagem com o nome levando às estantes, e "–" onde não há nenhum', () => {
    renderizar(<VisaoGeral />)

    const tabela = screen.getByRole('table', { name: 'Linhagens de Ratos' })
    const shr = within(tabela).getByRole('link', { name: 'SHR' })
    expect(shr.getAttribute('href')).toBe('/estantes?linhagem=2')

    const linha = shr.closest('tr')!
    const celulas = [...linha.querySelectorAll('td')].map((td) => td.textContent)
    expect(celulas).toEqual(['SHR', '1', '♂ 6♀ 5', '♂ 3♀ 3', '–', '♂ 6♀ 5'])
  })

  it('separa os livres pelas faixas de idade', () => {
    renderizar(<VisaoGeral />)

    const tabela = screen.getByRole('table', { name: 'Livres por idade de Ratos' })
    // o antd repete o cabeçalho numa linha escondida, só para medir a largura: vale o visível
    const cabecalho = within(tabela)
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(cabecalho).toEqual(['Linhagem', 'até 21 d', '22–35 d', '36–60 d', 'mais de 60 d'])
    const wistar = within(tabela).getByRole('link', { name: 'Wistar' }).closest('tr')!
    expect([...wistar.querySelectorAll('td')].map((td) => td.textContent)).toEqual([
      'Wistar',
      '♂ 3♀ 2',
      '♂ 5♀ 6',
      '♂ 3♀ 5',
      '–',
    ])
  })

  it('a espécie sem linhagem aparece, só com o aviso', () => {
    renderizar(<VisaoGeral />)

    expect(screen.getByText('Camundongos')).toBeTruthy()
    expect(screen.getByText('Nenhuma linhagem nesta espécie.')).toBeTruthy()
    expect(screen.queryByLabelText('Totais de Camundongos')).toBeNull()
  })
})

describe('Visão geral no celular', { timeout: 20_000 }, () => {
  it('cada linhagem vira um cartão: o nome leva às estantes, os números em duas colunas e os livres por idade em quatro', () => {
    const voltar = larguraDaTela(390)
    try {
      renderizar(<VisaoGeral />)

      // sem as tabelas, que rolariam de lado
      expect(screen.queryByRole('table')).toBeNull()
      // o placar continua
      expect(noPlacar('Ratos', 'Livres')).toBe('♂17♀18')

      const lista = screen.getByRole('list', { name: 'Linhagens de Ratos' })
      expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
      const shr = within(lista).getByRole('link', { name: 'SHR' })
      expect(shr.getAttribute('href')).toBe('/estantes?linhagem=2')

      const cartao = shr.closest('li')!
      expect(within(cartao).getByText('1 casal')).toBeTruthy()
      const dado = (rotulo: string) =>
        within(cartao).getByText(rotulo, { selector: 'dt' }).parentElement!.querySelector('dd')!
          .textContent
      expect(dado('Vivos')).toBe('♂ 6♀ 5')
      expect(dado('Mamando')).toBe('♂ 3♀ 3')
      expect(dado('Reservados')).toBe('–')
      expect(dado('Livres')).toBe('♂ 6♀ 5')
      expect(
        [...cartao.querySelectorAll('.visao__faixa')].map((faixa) => faixa.textContent),
      ).toEqual(['até 21 d♂ 3♀ 3', '22–35 d♂ 3♀ 2', '36–60 d–', '> 60 d–'])
    } finally {
      voltar()
    }
  })
})
