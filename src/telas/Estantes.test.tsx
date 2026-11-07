import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Estante } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { Estantes } from './Estantes'

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

vi.mock('@/dominio/consultas', () => ({
  useEstantes: () => consulta([estante(1, 'Sala 1', 'E-01'), estante(2, 'Sala 2', 'E-03')]),
  useGrade: () => consulta({ faces: [] }),
}))

// a ficha tem as consultas dela; aqui ela fica fechada e não importa
vi.mock('./FichaDaCaixa', () => ({ FichaDaCaixa: () => null }))

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
