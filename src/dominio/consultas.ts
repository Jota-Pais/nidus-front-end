// Tudo o que as telas leem e gravam na API
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { chaves, invalidarColonia, invalidarPedidos } from '@/app/chaves'
import { api, ErroDeApi } from '@/lib/api'
import { alvoDaReserva } from './pedido'
import type {
  Casal,
  Catalogo,
  Cruzamento,
  DataISO,
  Destino,
  Estante,
  FaltaDoPedido,
  FichaDaCaixa,
  Grade,
  LugarDaRetirada,
  Parto,
  Pedido,
  Perfil,
  PosicaoNaEstante,
  Projeto,
  RegistroDoHistorico,
  RespostaDaAlocacao,
  RespostaDaAnulacao,
  RespostaDaBaixa,
  RespostaDaDevolucao,
  RespostaDaEntrega,
  RespostaDaMudanca,
  RespostaDaRecusa,
  ResultadoDaBusca,
  Sala,
  Sexo,
  SituacaoDoProjeto,
  Usuario,
  Viabilidade,
  VisaoGeral,
} from './tipos'

// ------------------------------------------------------------ estantes e caixas

/** Quantos animais cada linhagem tem, reservados e livres: a Visão geral */
export function useVisaoGeral() {
  return useQuery({
    queryKey: chaves.visaoGeral,
    queryFn: () => api<VisaoGeral>('/api/visao-geral'),
    refetchInterval: 30_000,
  })
}

export function useMudarDePosicao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCaixa, ...posicao }: PosicaoNaEstante & { idCaixa: number }) =>
      api<{ idCaixa: number; idEstante: number; codigo: string }>(
        `/api/caixas/${idCaixa}/posicao`,
        { metodo: 'PATCH', corpo: posicao },
      ),
    // os animais vão junto com a caixa: o endereço muda na grade e nas fichas
    onSuccess: () => invalidarColonia(cliente),
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

/** A sala dá nome às abas das estantes e à grade: salvar recarrega as três */
function invalidarSalasEEstantes(cliente: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    cliente.invalidateQueries({ queryKey: chaves.salas }),
    cliente.invalidateQueries({ queryKey: chaves.estantes }),
    invalidarColonia(cliente),
  ])
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
    onSuccess: () => invalidarSalasEEstantes(cliente),
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
    onSuccess: () => invalidarSalasEEstantes(cliente),
  })
}

/** null deixa a consulta desligada: é assim que a ficha fechada não busca nada */
export function useFicha(idCaixa: number | null) {
  return useQuery({
    queryKey: chaves.caixa(idCaixa ?? 0),
    queryFn: () => api<FichaDaCaixa>(`/api/caixas/${idCaixa}`),
    enabled: idCaixa !== null,
  })
}

/** A caixa do casal encerrado vira caixa de estoque no lugar, com os desmamados dela */
export function useVirarCaixaDeEstoque() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (idCaixa: number) =>
      api<{ idCaixa: number; sexo: Sexo }>(`/api/caixas/${idCaixa}/estoque`, { metodo: 'POST' }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

// ------------------------------------------------------------ casais e partos

/** Caixa de estoque nova numa posição vazia, com animais de idade conhecida e casal desconhecido */
export interface EstoqueNovo {
  posicao: PosicaoNaEstante
  idLinhagem: number
  sexo: Sexo
  quantidade: number
  dtNascimento: DataISO
}

export function useNovaCaixaDeEstoque() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (estoque: EstoqueNovo) =>
      api<{ idCaixa: number; codigo: string }>('/api/caixas/estoque', {
        metodo: 'POST',
        corpo: estoque,
      }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** Acrescenta animais do cadastro inicial a uma caixa de estoque: sexo e linhagem são os dela */
export function useEntradaNaCaixa() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({
      idCaixa,
      ...corpo
    }: {
      idCaixa: number
      quantidade: number
      dtNascimento: DataISO
    }) => api<unknown>(`/api/caixas/${idCaixa}/entrada`, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

export interface CasalNovo {
  /** caixa que já existe, ou ... */
  idCaixa?: number
  /** ... posição vazia da estante, e a caixa nasce junto */
  posicao?: PosicaoNaEstante
  idLinhagem: number
  grupoMacho: string
  grupoFemea: string
  dtFormacao: DataISO
  /** o parto em que o casal está; 1 a 5. Depois do 1º, os de antes são do cadastro inicial */
  partoAtual: number
}

export function useFormarCasal() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (casal: CasalNovo) =>
      api<{ idCaixa: number; casal: Casal }>('/api/casais', { metodo: 'POST', corpo: casal }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/**
 * O que os registros da ficha devolvem: o parto ou o casal, e, na seleção e no desmame, os
 * pedidos que ficaram em falta porque perderam animais reservados
 */
export interface RespostaDoRegistro {
  faltas?: FaltaDoPedido[]
}

/**
 * Os registros feitos de dentro da ficha: acasalamento e encerramento do casal; nascimento,
 * seleção e desmame do parto. Cada um é um POST com o seu caminho
 */
export function useRegistrarNaFicha() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ caminho, corpo }: { caminho: string; corpo: unknown }) =>
      api<RespostaDoRegistro>(caminho, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** O parto pendente de casal encerrado que não vai nascer: fecha, e a caixa vazia é liberada */
export function useSemNinhada() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({
      idParto,
      ...corpo
    }: {
      idParto: number
      dtSemNinhada: DataISO
      motivo: string
    }) => api<Parto>(`/api/partos/${idParto}/sem-ninhada`, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** A correção do nascimento: data, contagem e, se a ninhada já saiu da caixa do casal, onde entram os a mais */
export interface CorrecaoDoNascimento {
  dtPartoReal: DataISO
  nascidoM: number
  nascidoF: number
  /** a caixa de estoque que recebe os animais a mais quando a do casal não serve mais */
  idCaixa?: number
  /** de qual pedido saem os reservados quando os livres não bastam */
  idPedido?: number
}

/**
 * A correção do desmame: a data e, só quando mudou, a contagem de um sexo ou dos dois. A contagem
 * muda pela baixa "não chegou ao desmame", que a API anula e lança de novo
 */
export interface CorrecaoDoDesmame {
  dtDesmameReal: DataISO
  desmamadoM?: number
  desmamadoF?: number
  /** de qual pedido saem os reservados que passam a não ter chegado ao desmame */
  idPedido?: number
}

/** A data e o motivo do fechamento sem ninhada: o motivo é o do fechamento, não o da correção */
export interface CorrecaoDoSemNinhada {
  dtSemNinhada: DataISO
  motivo: string
}

export type CorrecaoDoParto =
  | { idParto: number; evento: 'nascimento'; corpo: CorrecaoDoNascimento }
  | { idParto: number; evento: 'desmame'; corpo: CorrecaoDoDesmame }
  | { idParto: number; evento: 'sem-ninhada'; corpo: CorrecaoDoSemNinhada }

/** A correção de um evento já registrado do parto, pelo lápis Editar: sem motivo */
export function useCorrigirEvento() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idParto, evento, corpo }: CorrecaoDoParto) =>
      // o nascimento e o desmame devolvem também os pedidos que ficaram em falta
      api<{ parto?: Parto; faltas?: FaltaDoPedido[] }>(`/api/partos/${idParto}/${evento}`, {
        metodo: 'PATCH',
        corpo,
      }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** Como a baixa do parto fica: a data, a causa e quantos de cada sexo */
export interface CorrecaoDaBaixa {
  idParto: number
  idOcorrencia: number
  dtFato: DataISO
  tipo: TipoDaBaixa
  qtdM: number
  qtdF: number
  /** de qual pedido saem os reservados quando a baixa leva mais animais e os livres não bastam */
  idPedido?: number
}

/**
 * A baixa do parto lançada errada: com a mesma contagem, a API corrige no lugar; com outra, anula e
 * lança a certa, numa transação só. Devolve os pedidos que ficaram em falta
 */
export function useCorrigirBaixa() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idParto, idOcorrencia, ...corpo }: CorrecaoDaBaixa) =>
      api<{ parto: Parto; faltas?: FaltaDoPedido[] }>(
        `/api/partos/${idParto}/baixas/${idOcorrencia}`,
        { metodo: 'PATCH', corpo },
      ),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/**
 * O que muda no casal digitado errado: só os campos alterados, ao menos um. `partoInicial` é o
 * parto em que ele entrou no Nidus, e a API renumera os partos todos pelo mesmo deslocamento
 */
export type EdicaoDoCasal = Partial<
  Pick<CasalNovo, 'idLinhagem' | 'grupoMacho' | 'grupoFemea' | 'dtFormacao'> & {
    partoInicial: number
  }
>

/**
 * O que muda na caixa de estoque lançada errada: só os campos alterados, ao menos um. O nascimento
 * é o de cada ninhada do cadastro inicial (parto sem casal) com animais na caixa
 */
export interface EdicaoDoEstoque {
  idLinhagem?: number
  sexo?: Sexo
  nascimentos?: { idParto: number; dtNascimento: DataISO }[]
}

/** O engano de digitação na caixa de estoque, sobretudo no cadastro inicial: sem motivo */
export function useEditarCaixaDeEstoque() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCaixa, ...corpo }: EdicaoDoEstoque & { idCaixa: number }) =>
      api<FichaDaCaixa>(`/api/caixas/${idCaixa}`, { metodo: 'PATCH', corpo }),
    // a linhagem e o nascimento levam a ninhada inteira, e o sexo, os animais da caixa
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** O engano de digitação no casal, ativo ou encerrado: sem motivo, num formulário só */
export function useEditarCasal() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCasal, ...corpo }: EdicaoDoCasal & { idCasal: number }) =>
      api<Casal>(`/api/casais/${idCasal}`, { metodo: 'PATCH', corpo }),
    // a linhagem leva junto os partos, os animais e as caixas de estoque deles
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** A data do acasalamento digitada errada, ou a nova monta que não gasta um dos 5 partos */
export function useCorrigirAcasalamento() {
  const cliente = useQueryClient()

  return useMutation({
    // a data do acasalamento se edita direto, sem motivo
    mutationFn: ({ idParto, ...corpo }: { idParto: number; dtAcasalamento: DataISO }) =>
      api<Parto>(`/api/partos/${idParto}/acasalamento`, { metodo: 'PATCH', corpo }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

// ------------------------------------------------------------ animais

/** Os animais de um sexo e de uma idade que a ação toca */
export interface ItemDaBaixa {
  sexo: Sexo
  qtd: number
  /** só quando a caixa tem vivos de mais de uma idade naquele sexo */
  dtNascimento?: DataISO
  /** de qual pedido saem os reservados quando os livres não bastam */
  idPedido?: number
}

export type TipoDaBaixa = 'morte' | 'eutanasia'

export interface Baixa {
  idCaixa: number
  dtFato: DataISO
  tipo: TipoDaBaixa
  /** só na eutanásia da ninhada: a baixa é a seleção deste parto */
  idParto?: number
  itens: ItemDaBaixa[]
}

/** Morte ou eutanásia em qualquer caixa: saem primeiro os livres, depois os reservados */
export function useBaixa() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCaixa, ...corpo }: Baixa) =>
      api<RespostaDaBaixa>(`/api/caixas/${idCaixa}/baixa`, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

/** Os animais de um sexo que mudam de caixa, e para onde */
export interface GrupoQueMuda {
  qtd: number
  /** só quando a caixa tem vivos de mais de uma idade naquele sexo */
  dtNascimento?: DataISO
  /** de qual pedido saem os reservados quando os livres não bastam */
  idPedido?: number
  /** leva só os reservados de idPedido: juntar numa caixa os de um pedido */
  soDoPedido?: boolean
  destino: Destino
}

export interface Mudanca {
  /** a caixa de onde os animais saem: a do casal (a passagem para o estoque) ou uma de estoque */
  idCaixa: number
  dtFato: DataISO
  machos?: GrupoQueMuda
  femeas?: GrupoQueMuda
}

/** Desmamados mudam para caixas de estoque, machos numa e fêmeas noutra; a reserva vai junto */
export function useMudanca() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCaixa, ...corpo }: Mudanca) =>
      api<RespostaDaMudanca>(`/api/caixas/${idCaixa}/mudanca`, { metodo: 'POST', corpo }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

export interface Anulacao {
  /** o idOcorrencia do evento de baixa anulável */
  idOcorrencia: number
  /** sem ele, a trilha diz que a baixa foi lançada por engano */
  motivo?: string
  /** só quando a caixa da baixa não serve mais: para onde voltam os machos e as fêmeas */
  idCaixaMachos?: number
  idCaixaFemeas?: number
}

/**
 * A baixa lançada por engano: os animais voltam vivos para a caixa dela ou, se ela não serve
 * mais, para a caixa de estoque de cada sexo. A resposta diz para onde voltou cada sexo
 */
export function useAnularBaixa() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idOcorrencia, ...corpo }: Anulacao) =>
      api<RespostaDaAnulacao>(`/api/ocorrencias/${idOcorrencia}/anulacao`, {
        metodo: 'POST',
        corpo,
      }),
    onSuccess: () => invalidarColonia(cliente),
  })
}

// ------------------------------------------------------------ pedidos

/**
 * A ação do pedido recusada por regra (409) quase sempre quer dizer que o pedido ou os animais
 * mudaram depois que a tela leu: outra pessoa aprovou, reservou, entregou ou deu baixa. A tela
 * recarrega o que a ação recarregaria, e mostra como ficou
 */
function recarregarSeMudou(
  cliente: QueryClient,
  recarregar: (cliente: QueryClient) => Promise<void>,
) {
  return (erro: Error) =>
    erro instanceof ErroDeApi && erro.ehRegraDeNegocio ? recarregar(cliente) : undefined
}

/** O pesquisador recebe só os dele; técnico e gestor, todos */
export function usePedidos() {
  return useQuery({
    queryKey: chaves.pedidos,
    queryFn: async () => (await api<{ pedidos: Pedido[] }>('/api/pedidos')).pedidos,
  })
}

/** O corpo do POST /api/pedidos. O e-mail não vai: o back pega o da sessão */
export interface NovoPedido {
  nomePesquisador: string
  /** digitado pela pessoa: só o formato é conferido */
  protocoloCeua: string
  idLinhagem: number
  machos: number
  femeas: number
  qualquer: number
  /** idade exata é idadeMin = idadeMax */
  idadeMin: number
  idadeMax: number
  dataEntrega: DataISO
  observacoes?: string
}

export function useCriarPedido() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (pedido: NovoPedido) =>
      api<{ id: number }>('/api/pedidos', { metodo: 'POST', corpo: pedido }),
    onSuccess: () => invalidarPedidos(cliente),
  })
}

/** Antes de enviar, quem pede confere se o biotério consegue atender. Não grava nada */
export function useConferirViabilidade() {
  return useMutation({
    mutationFn: (pedido: NovoPedido) =>
      api<Viabilidade>('/api/pedidos/viabilidade', { metodo: 'POST', corpo: pedido }),
  })
}

/** A equipe aceita fazer o pedido. Os animais são reservados depois, em useAlocar */
export function useAprovarPedido() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (idPedido: number) =>
      api<{ idPedido: number; status: 'aprovado' }>(`/api/pedidos/${idPedido}/aprovacao`, {
        metodo: 'POST',
      }),
    onSuccess: () => invalidarPedidos(cliente),
    onError: recarregarSeMudou(cliente, invalidarPedidos),
  })
}

/** Recusa o enviado, o aprovado ou o reservado: os animais do reservado voltam a ficar livres */
export function useRecusarPedido() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idPedido, motivo }: { idPedido: number; motivo: string }) =>
      api<RespostaDaRecusa>(`/api/pedidos/${idPedido}/recusa`, {
        metodo: 'POST',
        corpo: { motivo },
      }),
    onSuccess: () => invalidarColonia(cliente),
    onError: recarregarSeMudou(cliente, invalidarColonia),
  })
}

/**
 * As caixas que atendem o pedido, já com a sugestão do sistema, para a equipe conferir ou
 * ajustar antes de reservar. Não grava nada. No reservado em falta, a busca pede só o que falta:
 * a sugestão, o déficit e os casais a formar saem para completar, não para o pedido inteiro
 */
export function useAtendimento(pedido: Pedido) {
  const alvo = alvoDaReserva(pedido)

  return useQuery({
    // o alvo entra na chave: a falta muda depois de uma baixa, e a busca muda com ela
    queryKey: [...chaves.atendimento(pedido.id), alvo],
    queryFn: () => {
      const parametros = new URLSearchParams({
        especie: pedido.especie,
        idLinhagem: String(pedido.idLinhagem),
        machos: String(alvo.machos),
        femeas: String(alvo.femeas),
        qualquer: String(alvo.qualquer),
        idadeMin: String(pedido.idadeMin),
        idadeMax: String(pedido.idadeMax),
        dataEntrega: pedido.dataEntrega,
      })
      return api<ResultadoDaBusca>(`/api/busca?${parametros.toString()}`)
    },
  })
}

/** Quantos machos e fêmeas reservar de um lugar da busca: a caixa e a data de nascimento */
export interface ItemDaReserva {
  idCaixa: number
  dtNascimento: DataISO
  machos: number
  femeas: number
}

/**
 * Reserva os animais: o pedido aprovado inteiro, ou, no reservado em falta, o que completa a falta
 * sem passar do pedido. O "qualquer" vai como macho ou fêmea
 */
export function useAlocar() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idPedido, itens }: { idPedido: number; itens: ItemDaReserva[] }) =>
      api<RespostaDaAlocacao>(`/api/pedidos/${idPedido}/alocacao`, {
        metodo: 'POST',
        corpo: { itens },
      }),
    onSuccess: () => invalidarColonia(cliente),
    onError: recarregarSeMudou(cliente, invalidarColonia),
  })
}

/** Desfaz a reserva, com falta ou sem: os animais voltam a ficar livres e o pedido, a aprovado */
export function useDesfazerReserva() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (idPedido: number) =>
      api<RespostaDaDevolucao>(`/api/pedidos/${idPedido}/devolucao`, { metodo: 'POST' }),
    onSuccess: () => invalidarColonia(cliente),
    onError: recarregarSeMudou(cliente, invalidarColonia),
  })
}

/** De quais caixas tirar os animais do pedido na entrega: onde os reservados estão de fato */
export function useRetirada(idPedido: number | null) {
  return useQuery({
    queryKey: chaves.retirada(idPedido ?? 0),
    queryFn: async () =>
      (await api<{ retirada: LugarDaRetirada[] }>(`/api/pedidos/${idPedido}/retirada`)).retirada,
    enabled: idPedido !== null,
  })
}

/** Os reservados saem das caixas onde estão, e a caixa que esvaziou é liberada */
export function useRegistrarEntrega() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idPedido, dtEntrega }: { idPedido: number; dtEntrega: DataISO }) =>
      api<RespostaDaEntrega>(`/api/pedidos/${idPedido}/entrega`, {
        metodo: 'POST',
        corpo: { dtEntrega },
      }),
    onSuccess: () => invalidarColonia(cliente),
    onError: recarregarSeMudou(cliente, invalidarColonia),
  })
}

// ------------------------------------------------------------ catálogo e histórico

export function useCatalogo() {
  return useQuery({
    queryKey: chaves.catalogo,
    queryFn: () => api<Catalogo>('/api/catalogo'),
    staleTime: 60 * 60_000,
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

// ------------------------------------------------------------ contas e projetos

export function useProjetos() {
  return useQuery({
    queryKey: chaves.projetos,
    queryFn: async () => (await api<{ projetos: Projeto[] }>('/api/projetos')).projetos,
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
        | {
            tipo: 'alterar'
            id: number
            dados: { nome?: string; ativa?: boolean; cruzamento?: Cruzamento | null }
          },
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
