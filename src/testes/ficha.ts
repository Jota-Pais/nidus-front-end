// O que as fichas da caixa leem nos testes: o parto, o casal, as fichas de casal e de estoque, a
// estante da caixa F1A e o catálogo. Cada teste muda só o que importa para ele
import { screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import type {
  Casal,
  Catalogo,
  Estante,
  EventoDaFicha,
  FichaDeCasal,
  FichaDeEstoque,
  Grade,
  OndeEstao,
  Parto,
} from '@/dominio/tipos'
import { ErroDeApi } from '@/lib/api'

/** O 1º parto do casal AB: 5 M e 5 F nasceram em 24/09, 1 de cada saiu na seleção, e mamam */
export const parto = (parcial: Partial<Parto> = {}): Parto => ({
  id: 10,
  ordem: 1,
  dtAcasalamento: '2026-09-01',
  dtPartoPrevisto: '2026-09-24',
  dtPartoReal: '2026-09-24',
  dtDesmamePrevisto: '2026-10-16',
  dtDesmameReal: null,
  dtSemNinhada: null,
  motivoSemNinhada: null,
  nascidoM: 5,
  nascidoF: 5,
  baixasAntesDoDesmame: { m: 1, f: 1 },
  desmamadoM: null,
  desmamadoF: null,
  vivos: { m: 4, f: 4 },
  onde: [lugar({ idCaixa: 7, codigo: 'F1A', tipo: 'casal', m: 4, f: 4 })],
  reservados: [],
  entregues: { m: 0, f: 0 },
  dtUltimaSelecao: null,
  dtPrimeiraSaida: null,
  dtPrimeiroFato: null,
  ...parcial,
})

/** Uma caixa onde estão vivos do parto: sem reservado, a não ser que o teste diga */
export const lugar = (parcial: Partial<OndeEstao> & Pick<OndeEstao, 'idCaixa'>): OndeEstao => ({
  codigo: 'F1A',
  numeroVisivel: 'E-01',
  tipo: 'casal',
  m: 0,
  f: 0,
  reservados: 0,
  pedidos: [],
  ...parcial,
})

/** Uma baixa anulável nos eventos da caixa */
export const eventoDeBaixa = (
  idOcorrencia: number,
  descricao: string,
  baixa: EventoDaFicha['baixa'],
  dataHora = '2026-10-20T00:00:00.000Z',
): EventoDaFicha => ({
  dataHora,
  tipo: 'baixa',
  descricao,
  autor: 'Ana Souza',
  idOcorrencia,
  anulavel: baixa !== null,
  baixa,
})

/** O mesmo parto já desmamado em 16/10, com os 4 M e 4 F ainda na caixa do casal */
export const desmamado = (parcial: Partial<Parto> = {}): Parto =>
  parto({ dtDesmameReal: '2026-10-16', desmamadoM: 4, desmamadoF: 4, ...parcial })

export const casal = (id: number, identificacao: string, ativo: boolean): Casal => ({
  id,
  identificacao,
  grupoMacho: identificacao.charAt(0),
  grupoFemea: identificacao.charAt(1),
  linhagem: 'Wistar',
  idLinhagem: 1,
  dtFormacao: '2026-09-01',
  ativo,
  dtEncerramento: ativo ? null : '2026-10-27',
})

/** A caixa F1A, de casal, com o casal AB ativo no 1º parto */
export const fichaDeCasal = (parcial: Partial<FichaDeCasal> = {}): FichaDeCasal => ({
  tipo: 'casal',
  virarEstoque: null,
  caixa: {
    id: 7,
    endereco: { numeroVisivel: 'E-01', sala: 'Sala 1', codigo: 'F1A' },
    especie: 'rato',
    linhagem: 'Wistar',
    idLinhagem: 1,
    estado: 'livres',
    ativa: true,
    dtLiberacao: null,
    motivoLiberacao: null,
  },
  casal: casal(1, 'AB', true),
  partos: [parto()],
  anteriores: [],
  eventos: [],
  ...parcial,
})

/** A caixa F1C, de estoque: 6 machos Wistar do 1º parto do casal AB, 2 reservados para o #12 */
export const fichaDeEstoque = (parcial: Partial<FichaDeEstoque> = {}): FichaDeEstoque => ({
  tipo: 'estoque',
  caixa: {
    id: 30,
    endereco: { numeroVisivel: 'E-01', sala: 'Sala 1', codigo: 'F1C' },
    especie: 'rato',
    linhagem: 'Wistar',
    idLinhagem: 1,
    sexo: 'M',
    estado: 'estoque',
    ativa: true,
    dtLiberacao: null,
    motivoLiberacao: null,
  },
  total: 6,
  reservado: 2,
  livre: 4,
  nascimentoDe: '2026-09-24',
  nascimentoAte: '2026-09-24',
  grupos: [
    {
      dtNascimento: '2026-09-24',
      idadeDias: 44,
      total: 6,
      reservados: 2,
      livres: 4,
      origens: [
        {
          idParto: 10,
          ordem: 1,
          casal: 'AB',
          codigoOrigem: 'F1A',
          numeroVisivelOrigem: 'E-01',
          qtd: 6,
        },
      ],
      pedidos: [{ idPedido: 12, qtd: 2 }],
      dtChegada: '2026-10-16',
    },
  ],
  pedidos: [{ idPedido: 12, qtd: 2 }],
  eventos: [],
  casaisAnteriores: [],
  ...parcial,
})

export const catalogo: Catalogo = {
  especies: [
    {
      id: 1,
      codigo: 'rato',
      nome: 'Rato',
      linhagens: [
        { id: 1, nome: 'Wistar', ativa: true },
        { id: 2, nome: 'Swiss', ativa: true },
      ],
    },
  ],
  paresGeneticos: [],
}

// a estante E-01 da sala 1: a F1A com o casal, a F1B e a F1D vazias, a F1C uma caixa de estoque
// de 6 machos Wistar, a F1E uma de 3 fêmeas Wistar e a F1F uma de machos Swiss
export const estanteE01: Estante = {
  id: 1,
  idSala: 1,
  sala: 'Sala 1',
  fabricante: 'ALESCO',
  modelo: 'Modelo 2',
  numeroVisivel: 'E-01',
  faces: 1,
  linhas: 1,
  colunas: 6,
}

const estoqueNaGrade = (sexo: 'M' | 'F', total: number, idLinhagem: number) => ({
  sexo,
  idLinhagem,
  total,
  reservado: 0,
  nascimentoDe: null,
  nascimentoAte: null,
  grupos: [],
})

export const gradeE01: Grade = {
  faces: [
    {
      face: 'frontal',
      posicoes: [
        {
          linha: 1,
          coluna: 1,
          codigo: 'F1A',
          caixa: {
            id: 7,
            estado: 'livres',
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
            id: 30,
            estado: 'estoque',
            idLinhagem: 1,
            linhagem: 'Wistar',
            casal: null,
            estoque: estoqueNaGrade('M', 6, 1),
          },
        },
        { linha: 1, coluna: 4, codigo: 'F1D', caixa: null },
        {
          linha: 1,
          coluna: 5,
          codigo: 'F1E',
          caixa: {
            id: 31,
            estado: 'estoque',
            idLinhagem: 1,
            linhagem: 'Wistar',
            casal: null,
            estoque: estoqueNaGrade('F', 3, 1),
          },
        },
        {
          linha: 1,
          coluna: 6,
          codigo: 'F1F',
          caixa: {
            id: 32,
            estado: 'estoque',
            idLinhagem: 2,
            linhagem: 'Swiss',
            casal: null,
            estoque: estoqueNaGrade('M', 2, 2),
          },
        },
      ],
    },
  ],
}

/** A recusa da API, como o 'api' a levanta */
export const erroDaApi = (
  status: number,
  codigo: string,
  mensagem: string,
  campos?: Record<string, string>,
) => new ErroDeApi(status, { erro: { codigo, mensagem, ...(campos ? { campos } : {}) } })

/** Uma mutação da colônia: a resposta (ou a recusa) vem do 'mutateAsync' do teste */
export const mutacaoComResposta = (mutateAsync: ReturnType<typeof vi.fn>) => ({
  mutateAsync,
  isPending: false,
})

/** O dia no calendário aberto: a classe dele diz se está apagado */
export const diaNoCalendario = (data: string) =>
  document.querySelector(`td[title="${data}"]`)?.className ?? '(sem dia)'

export const APAGADO = 'ant-picker-cell-disabled'

// ------------------------------------------------------------ consultas rápidas
// O getByRole calcula o nome acessível de cada elemento da tela, e a ficha do antd tem milhares:
// cada consulta levava segundos no jsdom. Estas acham pelo texto, pelo título ou pelo atributo

type Texto = string | RegExp

/** Os botões com o texto, dentro de 'onde' */
export function botoes(texto: Texto, onde: HTMLElement = document.body): HTMLButtonElement[] {
  const achados = within(onde).queryAllByText(texto, { selector: 'button, button span' })
  return [...new Set(achados.map((no) => no.closest('button') as HTMLButtonElement))]
}

/** O botão com o texto, ou null */
export function talvezBotao(texto: Texto, onde?: HTMLElement): HTMLButtonElement | null {
  return botoes(texto, onde)[0] ?? null
}

/** O botão com o texto; sem ele, o teste falha dizendo qual */
export function botao(texto: Texto, onde?: HTMLElement): HTMLButtonElement {
  const achado = talvezBotao(texto, onde)
  if (!achado) throw new Error(`Sem o botão ${String(texto)}`)
  return achado
}

/** Espera o botão aparecer */
export const acharBotao = (texto: Texto, onde?: HTMLElement) => waitFor(() => botao(texto, onde))

/** A célula da estante em miniatura, pelo título: "F1B: posição vazia, vira caixa de estoque nova" */
export const celula = (titulo: Texto, onde: HTMLElement = document.body) =>
  within(onde).getByTitle(titulo) as HTMLButtonElement

/** O grupo de um sexo na mudança (role="group" com o nome do sexo) */
export function talvezGrupo(nome: string): HTMLElement | null {
  return document.querySelector(`[role="group"][aria-label="${nome}"]`)
}

export function grupo(nome: string): HTMLElement {
  const achado = talvezGrupo(nome)
  if (!achado) throw new Error(`Sem o grupo ${nome}`)
  return achado
}

/** A aba pelo nome */
export const aba = (nome: string) => screen.getByText(nome, { selector: '[role="tab"]' })

/** Os nomes das abas, na ordem */
export const nomesDasAbas = () =>
  [...document.querySelectorAll('[role="tab"]')].map((elemento) => elemento.textContent)

/** O conteúdo da aba aberta */
export const abaAberta = () =>
  waitFor(() => {
    const painel = document.querySelector<HTMLElement>('.ant-tabs-tabpane-active')
    if (!painel) throw new Error('Nenhuma aba aberta')
    return painel
  })

/** O campo de escolha (Select do antd) pelo rótulo */
export function selecao(rotulo: Texto): HTMLElement {
  const campo = screen
    .getAllByLabelText(rotulo)
    .find((no) => no.getAttribute('role') === 'combobox')
  if (!campo) throw new Error(`Sem a escolha ${String(rotulo)}`)
  return campo
}
