import { RightOutlined } from '@ant-design/icons'
import { App, Form, Grid, Input, InputNumber, Modal, Segmented, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePerfil } from '@/auth/contexto'
import {
  Aviso,
  Botao,
  CabecalhoDaTela,
  CampoDeData,
  Entrada,
  Etiqueta,
  Formulario,
  Pilha,
  Secao,
  SetasDeOrdem,
  Texto,
} from '@/componentes'
import type { TomDeEtiqueta } from '@/componentes'
import {
  useAprovarSolicitacao,
  useCatalogo,
  useConferirViabilidade,
  useCriarSolicitacao,
  useDesfazerReserva,
  useRecusarSolicitacao,
  useRegistrarEntrega,
  useSolicitacoes,
} from '@/dominio/consultas'
import {
  FILTROS_DE_SOLICITACAO,
  avisoDeEntregaSemReserva,
  compararDataDeEntrega,
  compararDataDoPedido,
  descreverAnimais,
  descreverIdade,
  entraNoFiltro,
  totalDeAnimais,
} from '@/dominio/solicitacao'
import type { NovaSolicitacao } from '@/dominio/consultas'
import type { FiltroDeSolicitacao } from '@/dominio/solicitacao'
import type { CodigoEspecie, Solicitacao, StatusSolicitacao, Viabilidade } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { formatarData, hoje } from '@/lib/data'
import { AtenderPedido } from './AtenderPedido'
import { CampoDeIdade } from './CampoDeIdade'
import { CampoDoProtocolo } from './CampoDoProtocolo'
import { ConfirmarPedido } from './ConfirmarPedido'
import { PECA_UM_ANIMAL, montarPedido, temAnimal, validadorDoPedido } from './solicitacao.schema'
import type { CamposDoPedido } from './solicitacao.schema'
import './Solicitacao.css'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Rato' },
  { value: 'camundongo', label: 'Camundongo' },
]

/**
 * A etiqueta de cada situação. Quando quem pediu lê outra coisa, o rótulo dele vem à parte: o
 * aprovado ainda sem os animais é trabalho da equipe, e para quem pediu já é pedido aceito
 */
const STATUS: Record<
  StatusSolicitacao,
  { rotulo: string; paraQuemPediu?: string; tom: TomDeEtiqueta }
> = {
  rascunho: { rotulo: 'Rascunho', tom: 'neutro' },
  enviada: { rotulo: 'Aguardando análise', tom: 'informacao' },
  em_analise: { rotulo: 'Em análise', tom: 'informacao' },
  aprovada: { rotulo: 'Animais reservados', tom: 'sucesso' },
  recusada: { rotulo: 'Recusada', tom: 'erro' },
  ajustada: { rotulo: 'Ajustada', tom: 'atencao' },
  // ainda em andamento, como o que aguarda análise: o verde fica para os animais reservados
  em_atendimento: {
    rotulo: 'Aguardando animais',
    paraQuemPediu: 'Aceito, em andamento',
    tom: 'informacao',
  },
  concluida: { rotulo: 'Entregue', tom: 'neutro' },
  cancelada: { rotulo: 'Cancelada', tom: 'neutro' },
}

/**
 * Os números do pedido: sem setas, só inteiros, teclado numérico no celular. O que o número
 * conta vai no rótulo do campo, em cima, e não dentro da caixa
 */
const NUMERO = {
  className: 'solicitacao__numero',
  controls: false,
  precision: 0,
  inputMode: 'numeric',
} as const

/**
 * O que volta ao começo depois de enviar. Nome e protocolo ficam: o pedido seguinte
 * costuma ser da mesma pessoa e do mesmo projeto
 */
const CAMPOS_DO_PEDIDO: (keyof CamposDoPedido)[] = [
  'especie',
  'idLinhagem',
  'modoIdade',
  'idadeMin',
  'idadeMax',
  'machos',
  'femeas',
  'qualquer',
  'dataEntrega',
  'observacoes',
]

/** Onde a API pode apontar erro. O primeiro recebe o foco quando o erro não aponta campo */
const CAMPOS_COM_ERRO = ['nomePesquisador', 'protocoloCeua', ...CAMPOS_DO_PEDIDO]

/** O pedido do pesquisador: no lugar do Word por e-mail, um formulário que já chega validado */
export function SolicitarAnimais() {
  const { message } = App.useApp()
  const { usuario, perfil } = usePerfil()
  const pesquisador = perfil === 'pesquisador'
  // O nome do pedido começa com o da conta, e a pessoa pode trocar. Vai no initialValues, que
  // só vale na montagem: a tela só monta com a sessão lida (ProvedorDePerfil)
  const nomeDaConta = usuario?.nome.trim()
  const [form] = Form.useForm<CamposDoPedido>()
  const catalogo = useCatalogo()
  const solicitacoes = useSolicitacoes()
  const criar = useCriarSolicitacao()
  const conferir = useConferirViabilidade()
  const falha = useFalhaDoFormulario(form, CAMPOS_COM_ERRO)
  // O pedido aberto na janela, pelo número: depois de cada ação a lista volta da API, e a janela
  // mostra o pedido como ficou
  const [aberto, setAberto] = useState<number | null>(null)
  const [reservando, setReservando] = useState<Solicitacao | null>(null)
  const [entregando, setEntregando] = useState<Solicitacao | null>(null)
  const [recusando, setRecusando] = useState<Solicitacao | null>(null)
  const [desfazendo, setDesfazendo] = useState<Solicitacao | null>(null)
  // O pedido já validado à espera da confirmação, com o veredito da viabilidade. 'null' no
  // veredito é a conferência que falhou
  const [aConfirmar, setAConfirmar] = useState<{
    pedido: NovaSolicitacao
    viabilidade: Viabilidade | null
  } | null>(null)
  const [filtro, setFiltro] = useState<FiltroDeSolicitacao>('todas')

  const especie = Form.useWatch('especie', form)
  const total = totalDeAnimais({
    machos: Form.useWatch('machos', form),
    femeas: Form.useWatch('femeas', form),
    qualquer: Form.useWatch('qualquer', form),
  })
  // A equipe quer saber quem pediu e o que fazer com o pedido; quem pediu, se aceitaram e
  // quando chega. Por isso cada um tem as suas colunas
  const telaLarga = Grid.useBreakpoint().sm === true
  const colunasDaTabela = pesquisador ? colunasDeQuemPediu(telaLarga) : colunasDaEquipe(telaLarga)
  const pedidoAberto = solicitacoes.data?.find((s) => s.id === aberto) ?? null

  // A ação feita até o fim fecha também o pedido; cancelada, volta para ele
  function concluir() {
    setReservando(null)
    setEntregando(null)
    setRecusando(null)
    setDesfazendo(null)
    setAberto(null)
  }
  const linhagens =
    catalogo.data?.especies
      .find((e) => e.codigo === especie)
      ?.linhagens.filter((l) => l.ativa)
      .map((l) => ({ value: l.id, label: l.nome })) ?? []

  // Antes de criar, a viabilidade: quem pede fica sabendo se dá ou não dá, e decide no modal
  function conferirAntes(campos: CamposDoPedido) {
    falha.limpar()
    const pedido = montarPedido(campos)
    conferir.mutate(pedido, {
      onSuccess: (viabilidade) => setAConfirmar({ pedido, viabilidade }),
      onError: () => setAConfirmar({ pedido, viabilidade: null }),
    })
  }

  function enviar(pedido: NovaSolicitacao) {
    criar.mutate(pedido, {
      onSuccess: () => {
        setAConfirmar(null)
        void message.success('Solicitação enviada. A equipe técnica vai analisar.')
        form.resetFields(CAMPOS_DO_PEDIDO)
      },
      onError: (erro) => {
        setAConfirmar(null)
        falha.mostrar(erro)
      },
    })
  }

  return (
    <Pilha>
      <CabecalhoDaTela titulo={pesquisador ? 'Solicitar animais' : 'Solicitações'} />

      {pesquisador && (
        <Secao>
          <Formulario<CamposDoPedido>
            form={form}
            onFinish={conferirAntes}
            disabled={criar.isPending || conferir.isPending}
            initialValues={{
              especie: 'rato',
              modoIdade: 'faixa',
              ...(nomeDaConta ? { nomePesquisador: nomeDaConta } : {}),
            }}
          >
            {falha.erro && (
              <div className="solicitacao__aviso">
                <Aviso tom="erro" titulo={falha.erro} />
              </div>
            )}

            {/* Duas colunas, lidas na ordem do código: à esquerda quem pede, que animal e quantos;
                à direita quando, as observações e o envio. Sem largura para as duas, a da direita
                desce inteira para baixo da outra */}
            <div className="solicitacao__colunas">
              <div className="solicitacao__coluna solicitacao__coluna--pedido">
                {/* Quem pede: o e-mail é o da conta, mostrado como texto porque não se muda */}
                <div className="solicitacao__fileira">
                  <Formulario.Campo
                    name="nomePesquisador"
                    rotulo="Nome"
                    {...(usuario ? { ajuda: usuario.email } : {})}
                    rules={[{ validator: validadorDoPedido('nomePesquisador') }]}
                    className="solicitacao__campo--nome"
                  >
                    <Entrada autoComplete="name" />
                  </Formulario.Campo>

                  <CampoDoProtocolo
                    name="protocoloCeua"
                    rotulo="Protocolo CEUA"
                    className="solicitacao__campo--protocolo"
                  />
                </div>

                {/* Que animal */}
                <div className="solicitacao__fileira">
                  <Formulario.Campo name="especie" rotulo="Espécie">
                    <Segmented<CodigoEspecie>
                      options={ESPECIES}
                      aria-label="Espécie"
                      onChange={() => form.setFieldValue('idLinhagem', undefined)}
                    />
                  </Formulario.Campo>

                  <Formulario.Campo
                    name="idLinhagem"
                    rotulo="Linhagem"
                    rules={[{ required: true, message: 'Escolha a linhagem' }]}
                    className="solicitacao__campo--linhagem"
                  >
                    <Select
                      options={linhagens}
                      placeholder="Selecione"
                      loading={catalogo.isPending}
                    />
                  </Formulario.Campo>

                  <CampoDeIdade />
                </div>

                {/* Quantos. Cada número é um campo com rótulo em cima, para o antd ligar o erro ao
                    campo e o leitor de tela o ler. A regra da soma fica só em "Machos", para sair
                    uma vez, e olha os outros dois pelas dependências */}
                <div className="solicitacao__fileira solicitacao__fileira--animais">
                  <Formulario.Campo
                    name="machos"
                    rotulo="Machos"
                    className="solicitacao__campo--numero"
                    dependencies={['femeas', 'qualquer']}
                    rules={[
                      { validator: validadorDoPedido('quantidade') },
                      ({ getFieldsValue }) => ({
                        validator: () =>
                          temAnimal(getFieldsValue(['machos', 'femeas', 'qualquer']))
                            ? Promise.resolve()
                            : Promise.reject(new Error(PECA_UM_ANIMAL)),
                      }),
                    ]}
                  >
                    <InputNumber {...NUMERO} />
                  </Formulario.Campo>

                  <Formulario.Campo
                    name="femeas"
                    rotulo="Fêmeas"
                    className="solicitacao__campo--numero"
                    rules={[{ validator: validadorDoPedido('quantidade') }]}
                  >
                    <InputNumber {...NUMERO} />
                  </Formulario.Campo>

                  <Formulario.Campo
                    name="qualquer"
                    rotulo="Qualquer sexo"
                    className="solicitacao__campo--numero"
                    rules={[{ validator: validadorDoPedido('quantidade') }]}
                  >
                    <InputNumber {...NUMERO} />
                  </Formulario.Campo>

                  {/* O rótulo vazio dá ao total a altura de um rótulo, e ele fica na linha das caixas */}
                  <Formulario.Campo rotulo={<span aria-hidden>&nbsp;</span>}>
                    <Texto tom="secundario" className="solicitacao__unidade">
                      = {total} {total === 1 ? 'animal' : 'animais'}
                    </Texto>
                  </Formulario.Campo>
                </div>
              </div>

              <div className="solicitacao__coluna">
                {/* Quando. Uma data por pedido: quem quer várias entregas faz um pedido para cada */}
                <div className="solicitacao__fileira">
                  <Formulario.Campo
                    name="dataEntrega"
                    rotulo="Entrega"
                    rules={[{ validator: validadorDoPedido('dataEntrega') }]}
                    className="solicitacao__campo--quando"
                  >
                    <CampoDeData min={hoje()} />
                  </Formulario.Campo>
                </div>

                <Formulario.Campo
                  name="observacoes"
                  rotulo="Observações"
                  opcional
                  rules={[{ validator: validadorDoPedido('observacoes') }]}
                >
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={500} />
                </Formulario.Campo>

                <div className="solicitacao__acoes">
                  <Botao
                    variante="primario"
                    htmlType="submit"
                    loading={conferir.isPending || criar.isPending}
                  >
                    Enviar solicitação
                  </Botao>
                </div>
              </div>
            </div>
          </Formulario>
        </Secao>
      )}

      {aConfirmar && (
        <ConfirmarPedido
          viabilidade={aConfirmar.viabilidade}
          enviando={criar.isPending}
          aoEnviar={() => enviar(aConfirmar.pedido)}
          aoVoltar={() => setAConfirmar(null)}
        />
      )}

      <EstadoDaConsulta consulta={solicitacoes} rotulo="Carregando as solicitações…">
        <Secao
          titulo={pesquisador ? 'Minhas solicitações' : undefined}
          semPreenchimento
          acoes={
            <Segmented<FiltroDeSolicitacao>
              className="solicitacao__filtro"
              aria-label="Filtrar solicitações"
              value={filtro}
              onChange={setFiltro}
              options={FILTROS_DE_SOLICITACAO.map(({ valor, rotulo }) => ({
                value: valor,
                label: `${rotulo} (${(solicitacoes.data ?? []).filter((s) => entraNoFiltro(valor, s)).length})`,
              }))}
            />
          }
        >
          {/* A ordem é a das setas no cabeçalho da coluna de data. Sem seta acesa, fica a da API,
              do pedido mais novo para o mais antigo */}
          <Table<Solicitacao>
            rowKey="id"
            className="solicitacao__lista"
            tableLayout="fixed"
            dataSource={(solicitacoes.data ?? []).filter((s) => entraNoFiltro(filtro, s))}
            showSorterTooltip={false}
            pagination={false}
            locale={{ emptyText: 'Nenhuma solicitação aqui.' }}
            columns={[
              ...colunasDaTabela,
              {
                key: 'abrir',
                width: 56,
                render: (_, s) => (
                  <button
                    type="button"
                    className="solicitacao__seta"
                    aria-label={pesquisador ? 'Abrir o pedido' : `Abrir o pedido #${s.id}`}
                    onClick={() => setAberto(s.id)}
                  >
                    <RightOutlined />
                  </button>
                ),
              },
            ]}
            // a linha inteira abre o pedido; a seta no fim é a mesma coisa pelo teclado
            onRow={(s) => ({ className: 'solicitacao__linha', onClick: () => setAberto(s.id) })}
          />
        </Secao>
      </EstadoDaConsulta>
      {/* As ações abrem por cima do pedido: canceladas, ele continua aberto embaixo */}
      {pedidoAberto && (
        <PedidoAberto
          solicitacao={pedidoAberto}
          paraQuemPediu={pesquisador}
          aoFechar={() => setAberto(null)}
          equipe={{
            aoReservar: setReservando,
            aoEntregar: setEntregando,
            aoRecusar: setRecusando,
            aoDesfazer: setDesfazendo,
          }}
        />
      )}
      {reservando && (
        <AtenderPedido
          solicitacao={reservando}
          aoFechar={() => setReservando(null)}
          aoConcluir={concluir}
          aoRecusar={() => {
            setReservando(null)
            setRecusando(reservando)
          }}
        />
      )}
      {entregando && (
        <RegistrarEntrega
          solicitacao={entregando}
          aoFechar={() => setEntregando(null)}
          aoConcluir={concluir}
        />
      )}
      {recusando && (
        <RecusarSolicitacao
          solicitacao={recusando}
          aoFechar={() => setRecusando(null)}
          aoConcluir={concluir}
        />
      )}
      {desfazendo && (
        <DesfazerReserva
          solicitacao={desfazendo}
          aoFechar={() => setDesfazendo(null)}
          aoConcluir={concluir}
        />
      )}
    </Pilha>
  )
}

/** O que a equipe faz com o pedido aberto, cada coisa na sua janela. Aprovar é na própria */
interface AcoesDaEquipe {
  aoReservar: (s: Solicitacao) => void
  aoEntregar: (s: Solicitacao) => void
  aoRecusar: (s: Solicitacao) => void
  aoDesfazer: (s: Solicitacao) => void
}

/** O que ficou faltando na reserva do pedido, quando falta */
function reservaEmFalta(s: Solicitacao): string | null {
  return s.reservaEmFalta
    ? `Reserva em falta: ${s.reservaEmFalta.m} M e ${s.reservaEmFalta.f} F`
    : null
}

/**
 * Embaixo da situação, para a equipe no pedido aberto: a reserva em falta, quando aprovou ou
 * recusou, ou até quando tem de responder
 */
function situacaoParaAEquipe(s: Solicitacao): string | null {
  const falta = reservaEmFalta(s)
  if (falta) return falta
  if (s.dataRecusa) return `Recusada em ${formatarData(s.dataRecusa)}`
  if (s.dataAceite) {
    const decisao = s.status === 'em_atendimento' ? 'Aprovada' : 'Aceita'
    return `${decisao} em ${formatarData(s.dataAceite)}`
  }
  if (s.prazoResposta) return `Responder até ${formatarData(s.prazoResposta)}`
  return null
}

/** Embaixo da situação, para quem pediu: por que recusaram, quando aceitaram, ou até quando sai a resposta */
function situacaoParaQuemPediu(s: Solicitacao): string | null {
  if (s.status === 'recusada') {
    return s.motivoRecusa ? `Motivo: ${s.motivoRecusa}` : null
  }
  if (s.dataAceite) {
    const decisao = s.status === 'em_atendimento' ? 'Aceito' : 'Aceita'
    return `${decisao} em ${formatarData(s.dataAceite)}`
  }
  if (s.prazoResposta) return `Resposta até ${formatarData(s.prazoResposta)}`
  return null
}

/**
 * A etiqueta da situação, o que vem embaixo dela e, só para a equipe, o aviso do pedido aprovado
 * sem reserva com a entrega perto. Na lista, a equipe vê embaixo para quando é o pedido; o prazo
 * para responder e a data da decisão ficam no pedido aberto
 */
function Situacao({
  solicitacao: s,
  paraQuemPediu,
  naLista = false,
}: {
  solicitacao: Solicitacao
  paraQuemPediu: boolean
  naLista?: boolean
}) {
  const situacao = STATUS[s.status]
  const rotulo = (paraQuemPediu && situacao.paraQuemPediu) || situacao.rotulo
  // na lista da equipe, a entrega no lugar do prazo e da data da decisão; a reserva em falta fica
  const listaDaEquipe = naLista && !paraQuemPediu
  const entrega = listaDaEquipe ? `Entrega em ${formatarData(s.dataEntrega)}` : null
  const embaixo = paraQuemPediu
    ? situacaoParaQuemPediu(s)
    : listaDaEquipe
      ? reservaEmFalta(s)
      : situacaoParaAEquipe(s)
  const aviso = paraQuemPediu ? null : avisoDeEntregaSemReserva(s)

  return (
    <div className="solicitacao__duasLinhas">
      <Etiqueta tom={situacao.tom} grande>
        {rotulo}
      </Etiqueta>
      {entrega && <Texto className="solicitacao__entrega">{entrega}</Texto>}
      {embaixo && <Texto tom="secundario">{embaixo}</Texto>}
      {aviso && <Texto className="solicitacao__alerta">{aviso}</Texto>}
    </div>
  )
}

/** A data de entrega, sem se partir */
function Entrega({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return <span className="solicitacao__semQuebra">{formatarData(s.dataEntrega)}</span>
}

/** O que pediu, em destaque: quantos de cada sexo e a linhagem */
function OQuePediu({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return <span className="solicitacao__animais">{`${descreverAnimais(s)} · ${s.linhagem}`}</span>
}

/** Para quem pediu: o que pediu em destaque e, embaixo, a idade */
function Animais({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <div className="solicitacao__duasLinhas solicitacao__pedido">
      <OQuePediu solicitacao={s} />
      <Texto tom="secundario">{`${descreverIdade(s)} de idade`}</Texto>
    </div>
  )
}

/** Para a equipe na tela estreita: o que pediu em destaque e, embaixo, quem pediu */
function Pedido({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <div className="solicitacao__duasLinhas solicitacao__pedido">
      <OQuePediu solicitacao={s} />
      <span title={s.pesquisador}>
        <Texto tom="secundario">{s.pesquisador}</Texto>
      </span>
    </div>
  )
}

/**
 * A coluna ordena pelas setas do cabeçalho: crescente, decrescente e sem ordem, a cada clique.
 * Abre na ordem dada
 */
function ordenaPor(
  comparar: (a: Solicitacao, b: Solicitacao) => number,
  inicio: 'ascend' | 'descend',
): Pick<TableColumnsType<Solicitacao>[number], 'sorter' | 'defaultSortOrder' | 'sortIcon'> {
  return {
    sorter: comparar,
    defaultSortOrder: inicio,
    sortIcon: ({ sortOrder }) => <SetasDeOrdem sortOrder={sortOrder} />,
  }
}

/** Para quem pediu: a entrega mais próxima primeiro */
const PELA_ENTREGA = ordenaPor(compararDataDeEntrega, 'ascend')

/** Para a equipe: o pedido mais novo primeiro */
const PELO_PEDIDO = ordenaPor(compararDataDoPedido, 'descend')

/**
 * Para quem pediu: quando chega, se aceitaram e o que pediu. O resto fica no pedido aberto. Na
 * tela estreita a coluna única ordena pela entrega, que é a data no topo de cada pedido
 */
function colunasDeQuemPediu(telaLarga: boolean): TableColumnsType<Solicitacao> {
  if (!telaLarga) {
    return [
      {
        key: 'solicitacao',
        title: 'Solicitação',
        ...PELA_ENTREGA,
        render: (_, s) => (
          <div className="solicitacao__compacta">
            <div className="solicitacao__compactaTopo">
              <Entrega solicitacao={s} />
              <Situacao solicitacao={s} paraQuemPediu />
            </div>
            <Animais solicitacao={s} />
          </div>
        ),
      },
    ]
  }

  return [
    {
      key: 'entrega',
      title: 'Entrega',
      width: 140,
      ...PELA_ENTREGA,
      render: (_, s) => <Entrega solicitacao={s} />,
    },
    {
      title: 'Situação',
      width: 280,
      render: (_, s) => <Situacao solicitacao={s} paraQuemPediu />,
    },
    {
      title: 'O que pediu',
      render: (_, s) => <Animais solicitacao={s} />,
    },
  ]
}

/**
 * Para a equipe: quando pediram, a situação com a entrega embaixo, quem pediu e o quê. O que fazer
 * com o pedido fica nele aberto. Na tela estreita a coluna única ordena pela data do pedido, que é
 * a data no topo de cada um
 */
function colunasDaEquipe(telaLarga: boolean): TableColumnsType<Solicitacao> {
  if (!telaLarga) {
    return [
      {
        key: 'solicitacao',
        title: 'Solicitação',
        ...PELO_PEDIDO,
        render: (_, s) => (
          <div className="solicitacao__compacta">
            <div className="solicitacao__compactaTopo">
              <span className="solicitacao__semQuebra">{formatarData(s.dataSolicitacao)}</span>
              <Situacao solicitacao={s} paraQuemPediu={false} naLista />
            </div>
            <Pedido solicitacao={s} />
          </div>
        ),
      },
    ]
  }

  return [
    {
      key: 'pedidoEm',
      title: 'Pedido em',
      // a data inteira e, no cabeçalho, o título com as setas ao lado
      width: 140,
      className: 'solicitacao__semQuebra',
      ...PELO_PEDIDO,
      render: (_, s) => formatarData(s.dataSolicitacao),
    },
    {
      title: 'Situação',
      width: 280,
      render: (_, s) => <Situacao solicitacao={s} paraQuemPediu={false} naLista />,
    },
    {
      title: 'Quem pediu',
      ellipsis: true,
      render: (_, s) => s.pesquisador,
    },
    {
      title: 'O que pediu',
      ellipsis: true,
      render: (_, s) => <OQuePediu solicitacao={s} />,
    },
  ]
}

const ROTULO_ESPECIE: Record<CodigoEspecie, string> = { rato: 'Rato', camundongo: 'Camundongo' }

/**
 * O pedido aberto, tudo de uma vez: a situação, o resumo e o resto do que foi pedido. Para a
 * equipe, embaixo, o que fazer com ele na situação em que está; quem pediu só confere
 */
function PedidoAberto({
  solicitacao: s,
  paraQuemPediu,
  equipe,
  aoFechar,
}: {
  solicitacao: Solicitacao
  paraQuemPediu: boolean
  equipe: AcoesDaEquipe
  aoFechar: () => void
}) {
  return (
    <Modal
      open
      width={600}
      // quem pediu não vê o número do pedido: para ele, o pedido é a data
      title={paraQuemPediu ? `Pedido de ${formatarData(s.dataSolicitacao)}` : `Pedido #${s.id}`}
      onCancel={aoFechar}
      footer={
        paraQuemPediu ? (
          <Botao onClick={aoFechar}>Fechar</Botao>
        ) : (
          <AcoesDoPedido solicitacao={s} equipe={equipe} aoFechar={aoFechar} />
        )
      }
    >
      <Pilha>
        <Situacao solicitacao={s} paraQuemPediu={paraQuemPediu} />
        <ResumoDoPedido solicitacao={s} comNome={!paraQuemPediu} />
        <dl className="solicitacao__ficha">
          <Dado rotulo="Pedido em">{formatarData(s.dataSolicitacao)}</Dado>
          <Dado rotulo="Protocolo CEUA">
            <span className="solicitacao__protocolo">{s.protocoloCeua}</span>
          </Dado>
          {!paraQuemPediu && <Dado rotulo="E-mail">{s.email}</Dado>}
          {/* quem pediu já lê o motivo embaixo da situação */}
          {!paraQuemPediu && s.motivoRecusa && (
            <Dado rotulo="Motivo da recusa" largo>
              {s.motivoRecusa}
            </Dado>
          )}
          <Dado rotulo="Observações" largo>
            {s.observacoes ?? '—'}
          </Dado>
        </dl>
      </Pilha>
    </Modal>
  )
}

/**
 * O que a equipe faz com o pedido em cada situação: a ação que leva o pedido adiante à direita,
 * em destaque, e a que recusa ou desfaz à esquerda, longe dela. Aprovar é aqui mesmo, sem outra
 * janela: o pedido inteiro já está à vista
 */
function AcoesDoPedido({
  solicitacao: s,
  equipe,
  aoFechar,
}: {
  solicitacao: Solicitacao
  equipe: AcoesDaEquipe
  aoFechar: () => void
}) {
  const { message } = App.useApp()
  const aprovar = useAprovarSolicitacao()

  function aprovarAgora() {
    aprovar.mutate(s.id, {
      onSuccess: () => {
        void message.success(`Solicitação #${s.id} aprovada.`)
        aoFechar()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  const recusar = (
    <Botao variante="fantasma" onClick={() => equipe.aoRecusar(s)}>
      Recusar
    </Botao>
  )
  const [aoLado, principal] =
    s.status === 'enviada'
      ? [
          recusar,
          <Botao variante="primario" loading={aprovar.isPending} onClick={aprovarAgora}>
            Aprovar
          </Botao>,
        ]
      : s.status === 'em_atendimento'
        ? // aprovado, falta reservar; o que não deu para produzir ainda pode ser recusado
          [
            recusar,
            <Botao variante="primario" onClick={() => equipe.aoReservar(s)}>
              Reservar animais
            </Botao>,
          ]
        : s.status === 'aprovada'
          ? // a ninhada reservada ficou com menos animais: desfaz a reserva para reservar de novo
            [
              s.reservaEmFalta && (
                <Botao variante="fantasma" onClick={() => equipe.aoDesfazer(s)}>
                  Desfazer reserva
                </Botao>
              ),
              <Botao variante="primario" onClick={() => equipe.aoEntregar(s)}>
                Registrar entrega
              </Botao>,
            ]
          : [null, null]

  return (
    <div className="solicitacao__rodape">
      <div>{aoLado}</div>
      <div className="solicitacao__rodapeFim">
        <Botao onClick={aoFechar}>Fechar</Botao>
        {principal}
      </div>
    </div>
  )
}

/** Um dado do pedido com o seu rótulo em cima. 'largo' ocupa a linha inteira da ficha */
function Dado({
  rotulo,
  numero = false,
  largo = false,
  children,
}: {
  rotulo: string
  numero?: boolean
  largo?: boolean
  children: ReactNode
}) {
  return (
    <div className={largo ? 'solicitacao__dado solicitacao__dado--largo' : 'solicitacao__dado'}>
      <dt>
        <Texto tom="rotulo">{rotulo}</Texto>
      </dt>
      <dd className={numero ? 'solicitacao__numeroGrande' : undefined}>{children}</dd>
    </div>
  )
}

/**
 * O pedido para bater o olho: quem pediu e a linhagem em cima; embaixo, cada quantidade, a idade
 * e a entrega. Para quem pediu, sem o próprio nome
 */
function ResumoDoPedido({
  solicitacao: s,
  comNome = true,
}: {
  solicitacao: Solicitacao
  comNome?: boolean
}) {
  const linhagem = `${ROTULO_ESPECIE[s.especie]} · ${s.linhagem}`
  const quantidades = [
    { rotulo: 'Machos', valor: s.machos },
    { rotulo: 'Fêmeas', valor: s.femeas },
    { rotulo: 'Qualquer sexo', valor: s.qualquer },
  ].filter(({ valor }) => valor > 0)

  return (
    <div className="solicitacao__resumo">
      {comNome ? (
        <div className="solicitacao__duasLinhas">
          <span className="solicitacao__destaque">{s.pesquisador}</span>
          <Texto tom="secundario">{linhagem}</Texto>
        </div>
      ) : (
        <span className="solicitacao__destaque">{linhagem}</span>
      )}
      <dl className="solicitacao__resumoDados">
        {quantidades.map(({ rotulo, valor }) => (
          <Dado key={rotulo} rotulo={rotulo} numero>
            {valor}
          </Dado>
        ))}
        <Dado rotulo="Idade">{descreverIdade(s)}</Dado>
        <Dado rotulo="Entrega">{formatarData(s.dataEntrega)}</Dado>
      </dl>
    </div>
  )
}

function RegistrarEntrega({
  solicitacao,
  aoFechar,
  aoConcluir,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
  aoConcluir: () => void
}) {
  const { message } = App.useApp()
  const registrar = useRegistrarEntrega()
  const [form] = Form.useForm<{ dtEntrega: string }>()

  function salvar({ dtEntrega }: { dtEntrega: string }) {
    registrar.mutate(
      { idSolicitacao: solicitacao.id, dtEntrega },
      {
        onSuccess: () => {
          void message.success(`Entrega da solicitação #${solicitacao.id} registrada.`)
          aoConcluir()
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Modal
      open
      title={`Registrar entrega · #${solicitacao.id}`}
      okText="Registrar entrega"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={registrar.isPending}
    >
      <Texto>
        {descreverAnimais(solicitacao)} de {solicitacao.linhagem}, protocolo CEUA{' '}
        {solicitacao.protocoloCeua}.
      </Texto>
      <Form form={form} layout="vertical" onFinish={salvar} initialValues={{ dtEntrega: hoje() }}>
        <Form.Item
          name="dtEntrega"
          label="Data da entrega"
          rules={[
            { required: true, message: 'Informe a data' },
            {
              validator: (_, valor?: string) =>
                !valor || valor <= hoje()
                  ? Promise.resolve()
                  : Promise.reject(new Error('A entrega não pode ser no futuro')),
            },
          ]}
        >
          <CampoDeData max={hoje()} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function RecusarSolicitacao({
  solicitacao,
  aoFechar,
  aoConcluir,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
  aoConcluir: () => void
}) {
  const { message } = App.useApp()
  const recusar = useRecusarSolicitacao()
  const [form] = Form.useForm<{ motivo: string }>()

  function salvar({ motivo }: { motivo: string }) {
    recusar.mutate(
      { idSolicitacao: solicitacao.id, motivo },
      {
        onSuccess: () => {
          void message.success(`Solicitação #${solicitacao.id} recusada.`)
          aoConcluir()
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Modal
      open
      title={`Recusar solicitação · #${solicitacao.id}`}
      okText="Recusar"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={recusar.isPending}
    >
      <Texto>O motivo aparece para quem pediu.</Texto>
      <Form form={form} layout="vertical" onFinish={salvar}>
        <Form.Item
          name="motivo"
          label="Motivo"
          rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
        >
          <Input.TextArea rows={3} maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function DesfazerReserva({
  solicitacao,
  aoFechar,
  aoConcluir,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
  aoConcluir: () => void
}) {
  const { message } = App.useApp()
  const desfazer = useDesfazerReserva()
  const falta = solicitacao.reservaEmFalta

  function confirmar() {
    desfazer.mutate(solicitacao.id, {
      onSuccess: () => {
        void message.success(`Reserva da solicitação #${solicitacao.id} desfeita.`)
        aoConcluir()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  return (
    <Modal
      open
      title={`Desfazer reserva · #${solicitacao.id}`}
      okText="Desfazer reserva"
      cancelText="Cancelar"
      onOk={confirmar}
      onCancel={aoFechar}
      confirmLoading={desfazer.isPending}
    >
      <Pilha>
        {falta && (
          <Texto>
            A ninhada reservada para este pedido ficou com menos animais: faltam até {falta.m} M e{' '}
            {falta.f} F.
          </Texto>
        )}
        <Texto>
          As reservas são canceladas e o pedido volta para Aguardando animais; depois, é só reservar
          de novo. Quem pediu não é avisado.
        </Texto>
      </Pilha>
    </Modal>
  )
}
