// Tudo o que as telas leem e gravam na API
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chaves, invalidarColonia } from '@/app/chaves'
import { api } from '@/lib/api'
import type {
  Catalogo,
  CodigoEspecie,
  Face,
  FichaDeEstoque,
  RetiradaDaEntrega,
  Sexo,
  Estante,
  FaltaNaReserva,
  Ficha,
  Grade,
  Kanban,
  Estoque,
  Parto,
  Perfil,
  Projeto,
  RegistroDoHistorico,
  ResultadoDaBusca,
  Sala,
  SituacaoDoProjeto,
  Solicitacao,
  Usuario,
  Viabilidade,
} from './tipos'

export function useKanban(especie: CodigoEspecie) {
  return useQuery({
    queryKey: chaves.quadro(especie),
    queryFn: () => api<Kanban>(`/api/quadro?especie=${especie}`),
    refetchInterval: 30_000,
  })
}

export interface PosicaoNova {
  idCaixa: number
  idEstante: number
  face: 'frontal' | 'traseira'
  linha: number
  coluna: number
}

export function useMudarDePosicao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCaixa, ...posicao }: PosicaoNova) =>
      api<{ idCaixa: number; idEstante: number; codigo: string }>(
        `/api/caixas/${idCaixa}/posicao`,
        {
          metodo: 'PATCH',
          corpo: posicao,
        },
      ),
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
    refetchInterval: 30_000,
  })
}

/** As salas ativas, com quantas estantes cada uma tem. Só o gestor muda, nos Cadastros */
export function useSalas() {
  return useQuery({
    queryKey: chaves.salas,
    queryFn: async () => (await api<{ salas: Sala[] }>('/api/salas')).salas,
  })
}

/** Remover é a sala sair das listas: o back só aceita a sala sem estante */
export function useSalvarSala() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (
      pedido:
        | { tipo: 'criar'; nome: string }
        | { tipo: 'renomear'; id: number; nome: string }
        | { tipo: 'remover'; id: number },
    ) => {
      if (pedido.tipo === 'criar') {
        return api('/api/salas', { metodo: 'POST', corpo: { nome: pedido.nome } })
      }
      if (pedido.tipo === 'renomear') {
        return api(`/api/salas/${pedido.id}`, { metodo: 'PATCH', corpo: { nome: pedido.nome } })
      }
      return api(`/api/salas/${pedido.id}`, { metodo: 'DELETE' })
    },
    // a estante traz o nome da sala: renomear muda as abas da tela Estantes
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: chaves.salas }),
        invalidarColonia(cliente),
      ]),
  })
}

export interface NovaEstante {
  idSala: number
  fabricante: string
  modelo: string
  numeroVisivel: string
  faces: number
  linhas: number
  colunas: number
}

/** O modelo não muda depois do cadastro: a edição leva só o número e a sala */
export function useSalvarEstante() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (
      pedido:
        | { tipo: 'criar'; dados: NovaEstante }
        | { tipo: 'alterar'; id: number; dados: { numeroVisivel: string; idSala: number } }
        | { tipo: 'remover'; id: number },
    ) => {
      if (pedido.tipo === 'criar') {
        return api('/api/estantes', { metodo: 'POST', corpo: pedido.dados })
      }
      if (pedido.tipo === 'alterar') {
        return api(`/api/estantes/${pedido.id}`, { metodo: 'PATCH', corpo: pedido.dados })
      }
      return api(`/api/estantes/${pedido.id}`, { metodo: 'DELETE' })
    },
    // a lista de salas conta as estantes de cada uma
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: chaves.salas }),
        invalidarColonia(cliente),
      ]),
  })
}

/** null deixa a consulta desligada - é assim que a ficha fechada não busca nada */
export function useFicha(idCaixa: number | null) {
  return useQuery({
    queryKey: chaves.caixa(idCaixa ?? 0),
    // a caixa de estoque tem a ficha dela, sem casal nem parto
    queryFn: () => api<Ficha | FichaDeEstoque>(`/api/caixas/${idCaixa}`),
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

/** O registro de parto, seleção e desmame devolve o parto, que pode vir com a reserva em falta */
export interface RespostaDoRegistro {
  falta?: FaltaNaReserva | null
}

/**
 * Os registros feitos de dentro da ficha (parto, seleção, desmame, encerramento). Cada um é um
 * POST com o seu caminho; depois dele kanban, grade e a própria ficha recarregam
 */
export function useRegistrarNaFicha(idCaixa: number) {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ caminho, corpo }: { caminho: string; corpo: unknown }) =>
      api<RespostaDoRegistro>(caminho, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente, idCaixa),
  })
}

/** Para onde vão os desmamados de um sexo: uma caixa de estoque, ou uma posição vazia */
export type DestinoDoEstoque =
  | { idCaixa: number }
  | { posicao: { idEstante: number; face: Face; linha: number; coluna: number } }

export interface PassagemParaOEstoque {
  idParto: number
  machos?: { qtd: number; destino: DestinoDoEstoque }
  femeas?: { qtd: number; destino: DestinoDoEstoque }
}

/** Os desmamados saem da caixa do casal para caixas de estoque, machos numa e fêmeas noutra */
export function usePassarParaOEstoque(idCaixa: number) {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idParto, ...dados }: PassagemParaOEstoque) =>
      api<{ caixas: { idCaixa: number; codigo: string; sexo: Sexo; qtd: number }[] }>(
        `/api/partos/${idParto}/estoque`,
        { metodo: 'POST', corpo: dados },
      ),
    onSuccess: () => invalidarColonia(cliente, idCaixa),
  })
}

/** A caixa do casal encerrado vira caixa de estoque no lugar, com os desmamados dela */
export function useVirarCaixaDeEstoque() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (idCaixa: number) =>
      api<{ idCaixa: number; sexo: Sexo }>(`/api/caixas/${idCaixa}/estoque`, { metodo: 'POST' }),
    onSuccess: (_resposta, idCaixa) => invalidarColonia(cliente, idCaixa),
  })
}

/** De qual caixa tirar os animais do pedido na entrega */
export function useRetirada(idSolicitacao: number | null) {
  return useQuery({
    queryKey: chaves.retirada(idSolicitacao ?? 0),
    queryFn: async () =>
      (await api<{ retirada: RetiradaDaEntrega[] }>(`/api/solicitacoes/${idSolicitacao}/retirada`))
        .retirada,
    enabled: idSolicitacao !== null,
  })
}

/** Só o gestor lista, nos Cadastros: quem pede digita o protocolo e não vê o dos outros */
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
    queryFn: async () =>
      (await api<{ solicitacoes: Solicitacao[] }>('/api/solicitacoes')).solicitacoes,
  })
}

export function useRegistrarEntrega() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idSolicitacao, dtEntrega }: { idSolicitacao: number; dtEntrega: string }) =>
      api(`/api/solicitacoes/${idSolicitacao}/entrega`, { metodo: 'POST', corpo: { dtEntrega } }),
    // o entregue sai da caixa, e a caixa que ficou vazia ou sem reserva muda de coluna
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
        cliente.invalidateQueries({ queryKey: ['caixa'] }),
        invalidarColonia(cliente),
      ]),
  })
}

/**
 * Desfaz a reserva em falta: as reservas do pedido são canceladas, e ele continua aprovado,
 * aguardando animais
 */
export function useDesfazerReserva() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (idSolicitacao: number) =>
      api(`/api/solicitacoes/${idSolicitacao}/devolucao`, { metodo: 'POST' }),
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
        invalidarColonia(cliente),
      ]),
  })
}

/** A equipe aceita fazer o pedido. Os animais são reservados depois, em useAlocar */
export function useAprovarSolicitacao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (idSolicitacao: number) =>
      api(`/api/solicitacoes/${idSolicitacao}/aprovacao`, { metodo: 'POST' }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
  })
}

export function useRecusarSolicitacao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idSolicitacao, motivo }: { idSolicitacao: number; motivo: string }) =>
      api(`/api/solicitacoes/${idSolicitacao}/recusa`, { metodo: 'POST', corpo: { motivo } }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
  })
}

/** O corpo do POST /api/solicitacoes. O e-mail não vai: o back pega o da sessão */
export interface NovaSolicitacao {
  nomePesquisador: string
  /** digitado pela pessoa; o back procura o projeto por ele */
  protocoloCeua: string
  idLinhagem: number
  machos: number
  femeas: number
  qualquer: number
  /** idade exata é idadeMin = idadeMax */
  idadeMin: number
  idadeMax: number
  dataEntrega: string
  observacoes?: string
}

export function useCriarSolicitacao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (pedido: NovaSolicitacao) =>
      api<{ id: number }>('/api/solicitacoes', { metodo: 'POST', corpo: pedido }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.solicitacoes }),
  })
}

/** Antes de enviar, quem pede confere se o CPMR consegue atender. Não grava nada */
export function useConferirViabilidade() {
  return useMutation({
    mutationFn: (pedido: NovaSolicitacao) =>
      api<Viabilidade>('/api/solicitacoes/viabilidade', { metodo: 'POST', corpo: pedido }),
  })
}

/**
 * As caixas que atendem o pedido, já com a sugestão do sistema, para a equipe conferir ou
 * ajustar antes de reservar. Não grava nada
 */
export function useAtendimento(pedido: Solicitacao) {
  return useQuery({
    queryKey: chaves.atendimento(pedido.id),
    queryFn: () => {
      const parametros = new URLSearchParams({
        especie: pedido.especie,
        idLinhagem: String(pedido.idLinhagem),
        machos: String(pedido.machos),
        femeas: String(pedido.femeas),
        qualquer: String(pedido.qualquer),
        idadeMin: String(pedido.idadeMin),
        idadeMax: String(pedido.idadeMax),
        dataEntrega: pedido.dataEntrega,
      })
      return api<ResultadoDaBusca>(`/api/busca?${parametros.toString()}`)
    },
  })
}

/** A equipe reserva as caixas do pedido aprovado: cada uma vira compromisso da solicitação */
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

export type EventoCorrigivel = 'nascimento' | 'selecao' | 'desmame'

/** A correção de um evento já registrado do parto: sempre com motivo, e volta o parto corrigido */
export function useCorrigirEvento(idCaixa: number) {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({
      idParto,
      evento,
      corpo,
    }: {
      idParto: number
      evento: EventoCorrigivel
      corpo: Record<string, unknown>
    }) =>
      api<{ parto: Parto; alerta: string | null }>(`/api/partos/${idParto}/${evento}`, {
        metodo: 'PATCH',
        corpo,
      }),
    onSuccess: () => invalidarColonia(cliente, idCaixa),
  })
}

export function useEstoque(especie: CodigoEspecie | undefined) {
  return useQuery({
    queryKey: chaves.estoque(especie ?? 'rato'),
    queryFn: () => api<Estoque>(`/api/estoque?especie=${especie}`),
    enabled: especie !== undefined,
  })
}

export interface FiltroDoHistorico {
  entidade: string | null
  idEntidade: number | null
  busca: string
}

export function caminhoDoHistorico(filtro: FiltroDoHistorico): string {
  const parametros = new URLSearchParams({ limite: '300' })
  if (filtro.entidade !== null) parametros.set('entidade', filtro.entidade)
  if (filtro.idEntidade !== null) parametros.set('idEntidade', String(filtro.idEntidade))
  if (filtro.busca.trim() !== '') parametros.set('busca', filtro.busca.trim())
  return `/api/historico?${parametros}`
}

export function useHistorico(filtro: FiltroDoHistorico) {
  return useQuery({
    queryKey: [...chaves.historico, filtro],
    queryFn: async () =>
      (await api<{ historico: RegistroDoHistorico[] }>(caminhoDoHistorico(filtro))).historico,
    placeholderData: keepPreviousData,
  })
}

export function useUsuarios() {
  return useQuery({
    queryKey: chaves.usuarios,
    queryFn: async () => (await api<{ usuarios: Usuario[] }>('/api/usuarios')).usuarios,
  })
}

export interface ContaNova {
  nome: string
  email: string
  perfil: Perfil
}

/** A conta nasce sem senha: a API manda à pessoa o código para definir a dela */
export function useCriarConta() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (conta: ContaNova) =>
      api<{ codigoEnviado: boolean }>('/api/usuarios', { metodo: 'POST', corpo: conta }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.usuarios }),
  })
}

/** O gestor não define a senha de ninguém: a API manda à pessoa o código do "esqueci a senha" */
export function useEnviarRedefinicaoDeSenha() {
  return useMutation({
    mutationFn: (id: number) =>
      api<{ email: string }>(`/api/usuarios/${id}/redefinicao-de-senha`, { metodo: 'POST' }),
  })
}

export function useSalvarUsuario() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (pedido: {
      tipo: 'alterar'
      id: number
      dados: { nome?: string; perfil?: Perfil; ativo?: boolean }
    }) => api(`/api/usuarios/${pedido.id}`, { metodo: 'PATCH', corpo: pedido.dados }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.usuarios }),
  })
}

export interface DadosDoProjeto {
  numero: string
  titulo: string
  idUsuarioResponsavel: number
  dtVigenciaInicio: string
  dtVigenciaFim: string
  cotaAutorizada: number
  situacao: SituacaoDoProjeto
}

export function useSalvarProjeto() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { id: number | null; dados: DadosDoProjeto }) =>
      id === null
        ? api('/api/projetos', { metodo: 'POST', corpo: dados })
        : api(`/api/projetos/${id}`, { metodo: 'PUT', corpo: dados }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.projetos }),
  })
}

export function useSalvarLinhagem() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (
      pedido:
        | { tipo: 'criar'; idEspecie: number; nome: string }
        | { tipo: 'alterar'; id: number; dados: { nome?: string; ativa?: boolean } },
    ) =>
      pedido.tipo === 'criar'
        ? api('/api/catalogo/linhagens', {
            metodo: 'POST',
            corpo: { idEspecie: pedido.idEspecie, nome: pedido.nome },
          })
        : api(`/api/catalogo/linhagens/${pedido.id}`, { metodo: 'PATCH', corpo: pedido.dados }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.catalogo }),
  })
}
