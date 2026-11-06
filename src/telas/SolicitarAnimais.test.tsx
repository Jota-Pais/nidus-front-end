import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Solicitacao } from '@/dominio/tipos'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { SolicitarAnimais } from './SolicitarAnimais'

const solicitacao = (
  id: number,
  status: Solicitacao['status'],
  motivoRecusa: string | null = null,
): Solicitacao => ({
  id,
  dataSolicitacao: '2026-11-0' + id,
  prazoResposta: status === 'enviada' ? '2026-11-15' : null,
  dataAceite: status === 'aprovada' ? '2026-11-03' : null,
  dataRecusa: status === 'recusada' ? '2026-11-04' : null,
  protocoloCeua: '23080.000001/2026-54',
  pesquisador: 'Ana',
  email: 'ana@ufsc.br',
  especie: 'rato',
  idLinhagem: 1,
  linhagem: 'Wistar',
  machos: 2,
  femeas: 2,
  qualquer: 0,
  idadeMin: 28,
  idadeMax: 28,
  dataEntrega: '2026-12-0' + id,
  cronograma: 'unica',
  observacoes: null,
  status,
  motivoRecusa,
})

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useConferirViabilidade: mutacao,
  useSolicitacoes: () =>
    consulta([
      solicitacao(1, 'enviada'),
      solicitacao(2, 'aprovada'),
      solicitacao(3, 'recusada', 'Sem Wistar ate dezembro'),
    ]),
  useCriarSolicitacao: mutacao,
  useRecusarSolicitacao: mutacao,
  useRegistrarEntrega: mutacao,
}))

/** O jsdom não tem largura: aqui o Grid do antd acha que a tela é larga */
function emTelaLarga(teste: () => void) {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    ...original(query),
    matches: true,
  })) as typeof window.matchMedia
  try {
    teste()
  } finally {
    window.matchMedia = original
  }
}

// A tela inteira do antd no jsdom leva de 4 a 9 s para montar: os 5 s padrão falham à toa
describe('lista de solicitações', { timeout: 20_000 }, () => {
  it('o técnico recusa a enviada e registra a entrega da alocada', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getAllByRole('button', { name: 'Recusar' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Registrar entrega' })).toHaveLength(1)
    // a equipe se refere ao pedido pelo número
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalhes' })[0]!)
    expect(screen.getByText('#3')).toBeTruthy()
  })

  it('o técnico e o gestor não veem o formulário de pedido', () => {
    renderizar(<SolicitarAnimais />, 'gestor')

    expect(screen.queryByRole('button', { name: 'Enviar solicitação' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Solicitações', level: 1 })).toBeTruthy()
  })

  it('o pesquisador vê o formulário de pedido', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByRole('button', { name: 'Enviar solicitação' })).toBeTruthy()
  })

  it('o pesquisador vê só as dele, sem o número do pedido, e não decide nem registra entrega', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByRole('heading', { name: 'Minhas solicitações' })).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalhes' })[0]!)
    expect(screen.queryByText('Nº do pedido')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar entrega' })).toBeNull()
  })

  it('de cara mostra a data, a situação com a data da decisão, quem pediu e o que pediu', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getByText('01/11/2026')).toBeTruthy()
    expect(screen.getByText('Responder até 15/11/2026')).toBeTruthy()
    expect(screen.getByText('Aceita em 03/11/2026')).toBeTruthy()
    expect(screen.getByText('Recusada em 04/11/2026')).toBeTruthy()
    expect(screen.getAllByText('Wistar · 2 M · 2 F')).toHaveLength(3)
    expect(screen.queryByText('ana@ufsc.br')).toBeNull()
  })

  it('em tela larga, as quatro informações ficam em colunas, sem rolar de lado', () => {
    emTelaLarga(() => {
      renderizar(<SolicitarAnimais />, 'tecnico')

      for (const coluna of ['Pedido em', 'Situação', 'Quem pediu e o quê']) {
        expect(screen.getByRole('columnheader', { name: coluna })).toBeTruthy()
      }
      expect(screen.getAllByText('Ana')).toHaveLength(3)
    })
  })

  it('quem pediu vê quando chega, se aceitaram e o que pediu, sem o próprio nome', () => {
    emTelaLarga(() => {
      renderizar(<SolicitarAnimais />, 'pesquisador')

      for (const coluna of ['Entrega', 'Situação', 'O que pediu']) {
        expect(screen.getByRole('columnheader', { name: coluna })).toBeTruthy()
      }
      expect(screen.queryByRole('columnheader', { name: 'Quem pediu e o quê' })).toBeNull()
      expect(screen.queryByText('Ana')).toBeNull()
      expect(screen.getByText('Resposta até 15/11/2026')).toBeTruthy()
      expect(screen.getByText('Aceita em 03/11/2026')).toBeTruthy()
      expect(screen.getAllByText('28 dias de idade')).toHaveLength(3)
    })
  })

  it('quem pediu vê o motivo da recusa na própria linha, sem abrir a setinha', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText('Motivo: Sem Wistar ate dezembro')).toBeTruthy()
    expect(screen.getByText('Recusada')).toBeTruthy()
  })

  it('o filtro separa pendentes, aceitas e recusadas, com a contagem', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getByText('Pendentes (1)')).toBeTruthy()
    expect(screen.getByText('Aceitas (1)')).toBeTruthy()
    expect(screen.queryByText(/A cumprir/)).toBeNull()
    expect(screen.getByText('Recusadas (1)')).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: /Pendentes/ }))
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Registrar entrega' })).toBeNull()
  })

  it('a equipe vê o pedido mais novo primeiro, e o pesquisador a entrega mais próxima', () => {
    const datas = (mes: string) =>
      screen.getAllByText(new RegExp(`^0[1-3]/${mes}/2026$`)).map((celula) => celula.textContent)

    // a equipe vê a data do pedido; quem pediu, a da entrega
    const equipe = renderizar(<SolicitarAnimais />, 'tecnico')
    expect(datas('11')).toEqual(['03/11/2026', '02/11/2026', '01/11/2026'])
    equipe.unmount()

    renderizar(<SolicitarAnimais />, 'pesquisador')
    expect(datas('12')).toEqual(['01/12/2026', '02/12/2026', '03/12/2026'])
  })

  it('a alocada aparece como Aprovada, e não como linguagem da equipe', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText('Aprovada')).toBeTruthy()
    expect(screen.queryByText('Caixas alocadas')).toBeNull()
  })
})

describe('quem pede', { timeout: 20_000 }, () => {
  it('o nome já vem com o da conta, e a pessoa pode trocar', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador', ' Beatriz Lima ')
    const nome = screen.getByLabelText<HTMLInputElement>('Nome')

    expect(nome.value).toBe('Beatriz Lima')
    // O e-mail é o da conta, embaixo do nome, e não se muda
    expect(screen.getByText('teste@ufsc.br')).toBeTruthy()

    fireEvent.change(nome, { target: { value: 'Beatriz Lima Souza' } })
    expect(nome.value).toBe('Beatriz Lima Souza')
  })

  it('conta sem nome deixa o campo em branco, para a pessoa escrever', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador', '   ')

    expect(screen.getByLabelText<HTMLInputElement>('Nome').value).toBe('')
  })
})
