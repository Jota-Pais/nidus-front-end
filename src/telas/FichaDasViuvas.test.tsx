import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FichaDaCaixa as Ficha } from '@/dominio/tipos'
import { hoje } from '@/lib/data'
import {
  acharBotao,
  botao,
  casal,
  catalogo,
  celula,
  estanteE01,
  fichaDeCasal,
  fichaDeViuvas,
  gradeComViuvas,
  mutacaoComResposta,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { FichaDaCaixa } from './FichaDaCaixa'

const api = vi.hoisted(() => ({
  fichas: {} as Record<number, unknown>,
  grade: null as unknown,
  levar: vi.fn(),
  idCasal: null as number | null,
}))

vi.mock('@/dominio/consultas', () => ({
  useFicha: (id: number | null) => consulta(id === null ? undefined : api.fichas[id]),
  useCatalogo: () => consulta(catalogo),
  useFormarCasal: () => mutacaoComResposta(vi.fn()),
  useRegistrarNaFicha: () => mutacaoComResposta(vi.fn()),
  useCorrigirEvento: () => mutacaoComResposta(vi.fn()),
  useCorrigirAcasalamento: () => mutacaoComResposta(vi.fn()),
  useCorrigirBaixa: () => mutacaoComResposta(vi.fn()),
  useEditarCasal: () => mutacaoComResposta(vi.fn()),
  useEditarCaixaDeEstoque: () => mutacaoComResposta(vi.fn()),
  useSemNinhada: () => mutacaoComResposta(vi.fn()),
  useMudanca: () => mutacaoComResposta(vi.fn()),
  useBaixa: () => mutacaoComResposta(vi.fn()),
  useAnularBaixa: () => mutacaoComResposta(vi.fn()),
  useVirarCaixaDeEstoque: () => mutacaoComResposta(vi.fn()),
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(api.grade),
  useMudarDePosicao: () => ({ mutate: vi.fn(), isPending: false }),
  useLevarParaViuvas: (idCasal: number) => {
    api.idCasal = idCasal
    return mutacaoComResposta(api.levar)
  },
}))

beforeEach(() => {
  api.fichas = { 7: fichaDeCasal(), 40: fichaDeViuvas() }
  api.grade = gradeComViuvas()
  api.levar.mockReset().mockResolvedValue(fichaDeViuvas())
  api.idCasal = null
})

function abrir(idCaixa: number, ficha?: Ficha) {
  if (ficha) api.fichas[idCaixa] = ficha
  renderizar(<FichaDaCaixa idCaixa={idCaixa} aoFechar={() => {}} />)
}

const encerrado = (parcial: Partial<ReturnType<typeof casal>>) => ({
  ...casal(1, 'AB', false),
  ...parcial,
})

describe('a caixa de viúvas', { timeout: 40_000 }, () => {
  it('mostra só de qual caixa cada fêmea veio e quando foi movida', () => {
    abrir(40)

    expect(screen.getByText('Caixa de viúvas')).toBeTruthy()
    const linhas = within(screen.getByRole('table'))
      .getAllByRole('row')
      .map((linha) => linha.textContent)
    expect(linhas).toEqual(['Veio da caixaMovida em', 'F1A21/10/2026', 'F2C03/11/2026'])
  })

  it('o casal encerrado transfere a fêmea para a caixa de viúvas da linhagem com vaga', async () => {
    abrir(7, fichaDeCasal({ casal: encerrado({ podeVirarViuva: true }) }))

    fireEvent.click(await acharBotao('Transferir a fêmea para uma caixa de viúvas'))
    fireEvent.click(celula('F1D: caixa de viúvas com 2 de 3 vagas ocupadas'))
    fireEvent.click(botao('Transferir'))

    await waitFor(() => expect(api.levar).toHaveBeenCalled(), { timeout: 10_000 })
    expect(api.idCasal).toBe(1)
    expect(api.levar).toHaveBeenCalledWith({ dtViuvez: hoje(), idCaixa: 40 })
  })

  it('a fêmea que já foi diz para qual caixa, e abre a caixa de viúvas na mesma janela', async () => {
    abrir(
      7,
      fichaDeCasal({
        casal: encerrado({
          viuva: { idCaixa: 40, codigoCaixa: 'F1D', numeroVisivel: 'E-01', dtViuvez: '2026-10-21' },
        }),
      }),
    )

    expect(
      screen.getByText('A fêmea foi para a caixa de viúvas F1D (E-01) em 21/10/2026.'),
    ).toBeTruthy()
    fireEvent.click(botao('Abrir a caixa F1D'))

    expect(await screen.findByText('Veio da caixa')).toBeTruthy()
  })
})
