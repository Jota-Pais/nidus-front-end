// Tudo o que as telas leem e gravam na API
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chaves, invalidarColonia } from '@/app/chaves'
import { api } from '@/lib/api'
import type {
  Catalogo,
  CodigoEspecie,
  Cronograma,
  EstadoCaixa,
  Estante,
  Ficha,
  Grade,
  Kanban,
  Projeto,
  ResultadoDaBusca,
  Solicitacao,
} from './tipos'

export function useKanban(especie: CodigoEspecie) {
  return useQuery({
    queryKey: chaves.quadro(especie),
    queryFn: () => api<Kanban>(`/api/quadro?especie=${especie}`),
  })
}

/** Card arrastado para outra coluna. 'confirmar' passa por cima de compromisso já firmado */
export function useMoverCaixa() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (dados: { idCaixa: number; estado: EstadoCaixa; confirmar: boolean }) =>
      api(`/api/caixas/${dados.idCaixa}/estado`, {
        metodo: 'PATCH',
        corpo: { estado: dados.estado, confirmar: dados.confirmar },
      }),
    // devolver a promessa faz o 'onSuccess' de quem chamou esperar o kanban recarregado
    onSuccess: (_resposta, { idCaixa }) => invalidarColonia(cliente, idCaixa),
  })
}

export function useEstantes() {
  return useQuery({
    queryKey: chaves.estantes,
    queryFn: async () => (await api<{ estantes: Estante[] }>('/api/estantes')).estantes,
  })
}

export function useGrade(idEstante: number) {
  return useQuery({
    queryKey: chaves.grade(idEstante),
    queryFn: () => api<Grade>(`/api/estantes/${idEstante}/grade`),
  })
}

export interface NovaEstante {
  sala: string
  fabricante: string
  modelo: string
  numeroVisivel: string
  faces: number
  linhas: number
  colunas: number
}

export function useCadastrarEstante() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (estante: NovaEstante) => api('/api/estantes', { metodo: 'POST', corpo: estante }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** null deixa a consulta desligada - é assim que a ficha fechada não busca nada */
export function useFicha(idCaixa: number | null) {
  return useQuery({
    queryKey: chaves.caixa(idCaixa ?? 0),
    queryFn: () => api<Ficha>(`/api/caixas/${idCaixa}`),
    enabled: idCaixa !== null,
  })
}

export interface CasalNovo {
  /** caixa que já existe, ou ... */
  idCaixa?: number
  /** ... posição vazia da estante, e a caixa nasce junto */
  posicao?: { idEstante: number; face: 'frontal' | 'traseira'; linha: number; coluna: number }
  idLinhagem: number
  grupoMacho: string
  grupoFemea: string
  dtFormacao: string
}

export function useFormarCasal() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (casal: CasalNovo) =>
      api<{ idCaixa: number }>('/api/casais', { metodo: 'POST', corpo: casal }),
    onSuccess: ({ idCaixa }) => invalidarColonia(cliente, idCaixa),
  })
}

/**
 * Os registros feitos de dentro da ficha (parto, seleção, desmame, encerramento). Cada um é um
 * POST com o seu caminho; depois dele kanban, grade e a própria ficha recarregam
 */
export function useRegistrarNaFicha(idCaixa: number) {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ caminho, corpo }: { caminho: string; corpo: unknown }) =>
      api(caminho, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente, idCaixa),
  })
}

export function useProjetos() {
  return useQuery({
    queryKey: chaves.projetos,
    queryFn: async () => (await api<{ projetos: Projeto[] }>('/api/projetos')).projetos,
  })
}

/** O pesquisador recebe só as dele; técnico e gestor, todas */
export function useSolicitacoes() {
  return useQuery({
    queryKey: chaves.solicitacoes,
    queryFn: async () => (await api<{ solicitacoes: Solicitacao[] }>('/api/solicitacoes')).solicitacoes,
  })
}

export interface NovaSolicitacao {
  idProjeto: number
  idLinhagem: number
  machos: number
  femeas: number
  idade: number
  dataEntrega: string
  cronograma: Cronograma
}

export function useCriarSolicitacao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (pedido: NovaSolicitacao) =>
      api<{ id: number }>('/api/solicitacoes', { metodo: 'POST', corpo: pedido }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
  })
}

interface PedidoDeBusca {
  especie: CodigoEspecie
  idLinhagem?: number | undefined
  machos: number
  femeas: number
  idade: number
  dataEntrega: string
  /** caixas já sugeridas nas remessas anteriores */
  excluir: number[]
}

export function buscarAtendimento(pedido: PedidoDeBusca): Promise<ResultadoDaBusca> {
  const parametros = new URLSearchParams({
    especie: pedido.especie,
    machos: String(pedido.machos),
    femeas: String(pedido.femeas),
    idade: String(pedido.idade),
    dataEntrega: pedido.dataEntrega,
    excluir: pedido.excluir.join(','),
  })
  if (pedido.idLinhagem !== undefined) parametros.set('idLinhagem', String(pedido.idLinhagem))

  return api<ResultadoDaBusca>(`/api/busca?${parametros.toString()}`)
}

/** O técnico aceita as caixas sugeridas: cada uma vira compromisso da solicitação */
export function useAlocar() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({
      idSolicitacao,
      itens,
    }: {
      idSolicitacao: number
      itens: { idParto: number; machos: number; femeas: number }[]
    }) => api(`/api/solicitacoes/${idSolicitacao}/alocacao`, { metodo: 'POST', corpo: { itens } }),
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
        invalidarColonia(cliente),
      ]),
  })
}

export function useCatalogo() {
  return useQuery({
    queryKey: chaves.catalogo,
    queryFn: () => api<Catalogo>('/api/catalogo'),
    staleTime: 60 * 60_000,
  })
}
