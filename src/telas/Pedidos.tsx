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
import {
  useAprovarPedido,
  useCatalogo,
  useConferirViabilidade,
  useCriarPedido,
  useDesfazerReserva,
  usePedidos,
  useRecusarPedido,
  useRegistrarEntrega,
} from '@/dominio/consultas'
import type { NovoPedido } from '@/dominio/consultas'
import {
  FILTROS_DE_PEDIDO,
  SITUACAO_DO_PEDIDO,
  avisoDeEntregaSemReserva,
  compararDataDeEntrega,
  compararDataDoPedido,
  descreverCaixasLiberadas,
  descreverIdade,
  descreverQuantidadeEEspecie,
  descreverQuantos,
  descreverQueFalta,
  descreverSexos,
  entraNoFiltro,
  podeRecusar,
  recebeReserva,
  totalDeAnimais,
  voltaramAFicarLivres,
} from '@/dominio/pedido'
import type { FiltroDePedido } from '@/dominio/pedido'
import type { CodigoEspecie, DataISO, Pedido, Viabilidade } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ErroDeApi } from '@/lib/api'
import { formatarData, hoje } from '@/lib/data'
import { AtenderPedido } from './AtenderPedido'
import { CampoDeIdade } from './CampoDeIdade'
import { CampoDoProtocolo } from './CampoDoProtocolo'
import { ConfirmarPedido } from './ConfirmarPedido'
import { RetiradaDaEntrega } from './RetiradaDaEntrega'
import { PECA_UM_ANIMAL, montarPedido, temAnimal, validadorDoPedido } from './pedido.schema'
import type { CamposDoPedido } from './pedido.schema'
import './Pedidos.css'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Rato' },
  { value: 'camundongo', label: 'Camundongo' },
]

/**
 * Os números do pedido: sem setas, só inteiros, teclado numérico no celular. O que o número
 * conta vai no rótulo do campo, em cima, e não dentro da caixa
 */
const NUMERO = {
  className: 'pedidos__numero',
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

/**
 * Os pedidos de animais. Quem pesquisa pede aqui, no lugar do Word por e-mail, num formulário que
 * já chega validado, e acompanha os seus; a equipe vê todos e leva cada um adiante: aprova,
 * reserva os animais, entrega ou recusa
 */
export function Pedidos() {
  const { message } = App.useApp()
  const { usuario, perfil } = usePerfil()
  const pesquisador = perfil === 'pesquisador'
  // O nome do pedido começa com o da conta, e a pessoa pode trocar. Vai no initialValues, que
  // só vale na montagem: a tela só monta com a sessão lida (ProvedorDePerfil)
  const nomeDaConta = usuario?.nome.trim()
  const [form] = Form.useForm<CamposDoPedido>()
  const catalogo = useCatalogo()
  const pedidos = usePedidos()
  const criar = useCriarPedido()
  const conferir = useConferirViabilidade()
  const falha = useFalhaDoFormulario(form, CAMPOS_COM_ERRO)
  // O pedido aberto na janela, pelo número: depois de cada ação a lista volta da API, e a janela
  // mostra o pedido como ficou
  const [aberto, setAberto] = useState<number | null>(null)
  const [reservando, setReservando] = useState<Pedido | null>(null)
  const [entregando, setEntregando] = useState<Pedido | null>(null)
  const [recusando, setRecusando] = useState<Pedido | null>(null)
  const [desfazendo, setDesfazendo] = useState<Pedido | null>(null)
  // O pedido já validado à espera da confirmação, com o veredito da viabilidade. 'null' no
  // veredito é a conferência que falhou
  const [aConfirmar, setAConfirmar] = useState<{
    pedido: NovoPedido
    viabilidade: Viabilidade | null
  } | null>(null)
  const [filtro, setFiltro] = useState<FiltroDePedido>('todos')

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
  const pedidoAberto = pedidos.data?.find((p) => p.id === aberto) ?? null

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

  function enviar(pedido: NovoPedido) {
    criar.mutate(pedido, {
      onSuccess: () => {
        setAConfirmar(null)
        void message.success('Pedido enviado. A equipe técnica vai analisar.')
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
      <CabecalhoDaTela titulo={pesquisador ? 'Solicitar animais' : 'Pedidos'} />

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
              <div className="pedidos__aviso">
                <Aviso tom="erro" titulo={falha.erro} />
              </div>
            )}

            {/* Duas colunas, lidas na ordem do código: à esquerda quem pede, que animal e quantos;
                à direita quando, as observações e o envio. Sem largura para as duas, a da direita
                desce inteira para baixo da outra */}
            <div className="pedidos__colunas">
              <div className="pedidos__coluna pedidos__coluna--pedido">
                {/* Quem pede: o e-mail é o da conta, mostrado como texto porque não se muda */}
                <div className="pedidos__fileira">
                  <Formulario.Campo
                    name="nomePesquisador"
                    rotulo="Nome"
                    {...(usuario ? { ajuda: usuario.email } : {})}
                    rules={[{ validator: validadorDoPedido('nomePesquisador') }]}
                    className="pedidos__campo--nome"
                  >
                    <Entrada autoComplete="name" />
                  </Formulario.Campo>

                  <CampoDoProtocolo
                    name="protocoloCeua"
                    rotulo="Protocolo CEUA"
                    className="pedidos__campo--protocolo"
                  />
                </div>

                {/* Que animal */}
                <div className="pedidos__fileira">
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
                    className="pedidos__campo--linhagem"
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
                <div className="pedidos__fileira pedidos__fileira--animais">
                  <Formulario.Campo
                    name="machos"
                    rotulo="Machos"
                    className="pedidos__campo--numero"
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
                    className="pedidos__campo--numero"
                    rules={[{ validator: validadorDoPedido('quantidade') }]}
                  >
                    <InputNumber {...NUMERO} />
                  </Formulario.Campo>

                  <Formulario.Campo
                    name="qualquer"
                    rotulo="Qualquer sexo"
                    className="pedidos__campo--numero"
                    rules={[{ validator: validadorDoPedido('quantidade') }]}
                  >
                    <InputNumber {...NUMERO} />
                  </Formulario.Campo>

                  {/* O rótulo vazio dá ao total a altura de um rótulo, e ele fica na linha das caixas */}
                  <Formulario.Campo rotulo={<span aria-hidden>&nbsp;</span>}>
                    <Texto tom="secundario" className="pedidos__unidade">
                      = {total} {total === 1 ? 'animal' : 'animais'}
                    </Texto>
                  </Formulario.Campo>
                </div>
              </div>

              <div className="pedidos__coluna">
                {/* Quando. Uma data por pedido: quem quer várias entregas faz um pedido para cada */}
                <div className="pedidos__fileira">
                  <Formulario.Campo
                    name="dataEntrega"
                    rotulo="Entrega"
                    rules={[{ validator: validadorDoPedido('dataEntrega') }]}
                    className="pedidos__campo--quando"
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

                <div className="pedidos__acoes">
                  <Botao
                    variante="primario"
                    htmlType="submit"
                    loading={conferir.isPending || criar.isPending}
                  >
                    Enviar pedido
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

      <EstadoDaConsulta consulta={pedidos} rotulo="Carregando os pedidos…">
        <Secao
          titulo={pesquisador ? 'Meus pedidos' : undefined}
          semPreenchimento
          acoes={
            <Segmented<FiltroDePedido>
              className="pedidos__filtro"
              aria-label="Filtrar pedidos"
              value={filtro}
              onChange={setFiltro}
              options={FILTROS_DE_PEDIDO.map(({ valor, rotulo }) => ({
                value: valor,
                label: `${rotulo} (${(pedidos.data ?? []).filter((p) => entraNoFiltro(valor, p)).length})`,
              }))}
            />
          }
        >
          {/* A ordem é a das setas no cabeçalho da coluna de data. Sem seta acesa, fica a da API,
              do pedido mais novo para o mais antigo */}
          <Table<Pedido>
            rowKey="id"
            className="pedidos__lista"
            tableLayout="fixed"
            dataSource={(pedidos.data ?? []).filter((p) => entraNoFiltro(filtro, p))}
            showSorterTooltip={false}
            pagination={false}
            locale={{ emptyText: 'Nenhum pedido aqui.' }}
            columns={[
              ...colunasDaTabela,
              {
                key: 'abrir',
                width: 56,
                render: (_, p) => (
                  <button
                    type="button"
                    className="pedidos__seta"
                    aria-label={pesquisador ? 'Abrir o pedido' : `Abrir o pedido #${p.id}`}
                    onClick={() => setAberto(p.id)}
                  >
                    <RightOutlined />
                  </button>
                ),
              },
            ]}
            // a linha inteira abre o pedido; a seta no fim é a mesma coisa pelo teclado
            onRow={(p) => ({ className: 'pedidos__linha', onClick: () => setAberto(p.id) })}
          />
        </Secao>
      </EstadoDaConsulta>
      {/* As ações abrem por cima do pedido: canceladas, ele continua aberto embaixo */}
      {pedidoAberto && (
        <PedidoAberto
          pedido={pedidoAberto}
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
          pedido={reservando}
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
          pedido={entregando}
          aoFechar={() => setEntregando(null)}
          aoConcluir={concluir}
          aoDesfazer={() => {
            setEntregando(null)
            setDesfazendo(entregando)
          }}
        />
      )}
      {recusando && (
        <RecusarPedido
          pedido={recusando}
          aoFechar={() => setRecusando(null)}
          aoConcluir={concluir}
        />
      )}
      {desfazendo && (
        <DesfazerReserva
          pedido={desfazendo}
          aoFechar={() => setDesfazendo(null)}
          aoConcluir={concluir}
        />
      )}
    </Pilha>
  )
}

/** O que a equipe faz com o pedido aberto, cada coisa na sua janela. Aprovar é na própria */
interface AcoesDaEquipe {
  aoReservar: (p: Pedido) => void
  aoEntregar: (p: Pedido) => void
  aoRecusar: (p: Pedido) => void
  aoDesfazer: (p: Pedido) => void
}

/** O que ficou faltando na reserva do pedido, quando falta: "Reserva em falta: 1 macho" */
function reservaEmFalta(p: Pedido): string | null {
  return p.reservaEmFalta ? `Reserva em falta: ${descreverQuantos(p.reservaEmFalta)}` : null
}

/**
 * Embaixo da situação, para a equipe no pedido aberto: quando entregou, quando recusou ou aprovou,
 * ou até quando tem de responder
 */
function situacaoParaAEquipe(p: Pedido): string | null {
  if (p.dataEntregue) return `Entregue em ${formatarData(p.dataEntregue)}`
  if (p.dataRecusa) return `Recusado em ${formatarData(p.dataRecusa)}`
  if (p.dataAceite) return `Aprovado em ${formatarData(p.dataAceite)}`
  if (p.prazoResposta) return `Responder até ${formatarData(p.prazoResposta)}`
  return null
}

/** Embaixo da situação, para quem pediu: por que recusaram, quando chegou, quando aceitaram, ou até quando sai a resposta */
function situacaoParaQuemPediu(p: Pedido): string | null {
  if (p.status === 'recusado') {
    return p.motivoRecusa ? `Motivo: ${p.motivoRecusa}` : null
  }
  if (p.dataEntregue) return `Entregue em ${formatarData(p.dataEntregue)}`
  if (p.dataAceite) return `Aceito em ${formatarData(p.dataAceite)}`
  if (p.prazoResposta) return `Resposta até ${formatarData(p.prazoResposta)}`
  return null
}

/**
 * A etiqueta da situação, o que vem embaixo dela e, só para a equipe, o que ela tem de resolver: a
 * reserva em falta e o pedido aprovado sem reserva com a entrega perto. Na lista, a equipe vê
 * embaixo para quando é o pedido; o prazo para responder e a data da decisão ficam no pedido aberto
 */
function Situacao({
  pedido: p,
  paraQuemPediu,
  naLista = false,
}: {
  pedido: Pedido
  paraQuemPediu: boolean
  naLista?: boolean
}) {
  const situacao = SITUACAO_DO_PEDIDO[p.status]
  const rotulo = (paraQuemPediu && situacao.paraQuemPediu) || situacao.rotulo
  // na lista da equipe, a entrega no lugar do prazo e da data da decisão
  const listaDaEquipe = naLista && !paraQuemPediu
  const entrega = !listaDaEquipe
    ? null
    : p.dataEntregue
      ? `Entregue em ${formatarData(p.dataEntregue)}`
      : `Entrega em ${formatarData(p.dataEntrega)}`
  const embaixo = paraQuemPediu
    ? situacaoParaQuemPediu(p)
    : listaDaEquipe
      ? null
      : situacaoParaAEquipe(p)
  // o que a equipe tem de resolver, em destaque, na lista e no pedido aberto
  const alertas = paraQuemPediu
    ? []
    : [reservaEmFalta(p), avisoDeEntregaSemReserva(p)].filter((alerta) => alerta !== null)

  return (
    <div className="pedidos__duasLinhas">
      <Etiqueta tom={situacao.tom} grande>
        {rotulo}
      </Etiqueta>
      {entrega && <Texto className="pedidos__entrega">{entrega}</Texto>}
      {embaixo && <Texto tom="secundario">{embaixo}</Texto>}
      {alertas.map((alerta) => (
        <Texto key={alerta} className="pedidos__alerta">
          {alerta}
        </Texto>
      ))}
    </div>
  )
}

/** A data de entrega, sem se partir */
function Entrega({ pedido: p }: { pedido: Pedido }) {
  return <span className="pedidos__semQuebra">{formatarData(p.dataEntrega)}</span>
}

/**
 * O que foi pedido, na lista: quantos ao todo, a espécie e a linhagem em destaque e, embaixo,
 * quantos de cada sexo, ou só "qualquer sexo". Quem pediu vê a idade junto; a equipe na tela
 * estreita vê ainda o nome de quem pediu
 */
function OQuePediu({
  pedido: p,
  comIdade = false,
  comNome = false,
}: {
  pedido: Pedido
  comIdade?: boolean
  comNome?: boolean
}) {
  const sexos = descreverSexos(p)

  return (
    <div className="pedidos__duasLinhas pedidos__oQuePediu">
      <span className="pedidos__animais">{descreverQuantidadeEEspecie(p)}</span>
      <Texto className="pedidos__sexos">
        {comIdade ? `${sexos} · ${descreverIdade(p)} de idade` : sexos}
      </Texto>
      {comNome && (
        <span title={p.pesquisador}>
          <Texto tom="secundario">{p.pesquisador}</Texto>
        </span>
      )}
    </div>
  )
}

/**
 * A coluna ordena pelas setas do cabeçalho: crescente, decrescente e sem ordem, a cada clique.
 * Abre na ordem dada
 */
function ordenaPor(
  comparar: (a: Pedido, b: Pedido) => number,
  inicio: 'ascend' | 'descend',
): Pick<TableColumnsType<Pedido>[number], 'sorter' | 'defaultSortOrder' | 'sortIcon'> {
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
function colunasDeQuemPediu(telaLarga: boolean): TableColumnsType<Pedido> {
  if (!telaLarga) {
    return [
      {
        key: 'pedido',
        title: 'Pedido',
        ...PELA_ENTREGA,
        render: (_, p) => (
          <div className="pedidos__compacta">
            <div className="pedidos__compactaTopo">
              <Entrega pedido={p} />
              <Situacao pedido={p} paraQuemPediu />
            </div>
            <OQuePediu pedido={p} comIdade />
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
      render: (_, p) => <Entrega pedido={p} />,
    },
    {
      title: 'Situação',
      width: 280,
      render: (_, p) => <Situacao pedido={p} paraQuemPediu />,
    },
    {
      title: 'Pedido',
      render: (_, p) => <OQuePediu pedido={p} comIdade />,
    },
  ]
}

/**
 * Para a equipe: quando pediram, a situação com a entrega embaixo, quem pediu e o quê. O que fazer
 * com o pedido fica nele aberto. Na tela estreita a coluna única ordena pela data do pedido, que é
 * a data no topo de cada um
 */
function colunasDaEquipe(telaLarga: boolean): TableColumnsType<Pedido> {
  if (!telaLarga) {
    return [
      {
        key: 'pedido',
        title: 'Pedido',
        ...PELO_PEDIDO,
        render: (_, p) => (
          <div className="pedidos__compacta">
            <div className="pedidos__compactaTopo">
              <span className="pedidos__semQuebra">{formatarData(p.dataPedido)}</span>
              <Situacao pedido={p} paraQuemPediu={false} naLista />
            </div>
            <OQuePediu pedido={p} comNome />
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
      className: 'pedidos__semQuebra',
      ...PELO_PEDIDO,
      render: (_, p) => formatarData(p.dataPedido),
    },
    {
      title: 'Situação',
      width: 280,
      render: (_, p) => <Situacao pedido={p} paraQuemPediu={false} naLista />,
    },
    {
      title: 'Quem pediu',
      ellipsis: true,
      render: (_, p) => p.pesquisador,
    },
    {
      title: 'Pedido',
      render: (_, p) => <OQuePediu pedido={p} />,
    },
  ]
}

const ROTULO_ESPECIE: Record<CodigoEspecie, string> = { rato: 'Rato', camundongo: 'Camundongo' }

/**
 * O pedido aberto, tudo de uma vez: a situação, o resumo e o resto do que foi pedido. Para a
 * equipe, embaixo, o que fazer com ele na situação em que está; quem pediu só confere
 */
function PedidoAberto({
  pedido: p,
  paraQuemPediu,
  equipe,
  aoFechar,
}: {
  pedido: Pedido
  paraQuemPediu: boolean
  equipe: AcoesDaEquipe
  aoFechar: () => void
}) {
  return (
    <Modal
      open
      width={600}
      // quem pediu não vê o número do pedido: para ele, o pedido é a data
      title={paraQuemPediu ? `Pedido de ${formatarData(p.dataPedido)}` : `Pedido #${p.id}`}
      onCancel={aoFechar}
      footer={
        paraQuemPediu ? (
          <Botao onClick={aoFechar}>Fechar</Botao>
        ) : (
          <AcoesDoPedido pedido={p} equipe={equipe} aoFechar={aoFechar} />
        )
      }
    >
      <Pilha>
        <Situacao pedido={p} paraQuemPediu={paraQuemPediu} />
        <ResumoDoPedido pedido={p} comNome={!paraQuemPediu} />
        <dl className="pedidos__ficha">
          <Dado rotulo="Pedido em">{formatarData(p.dataPedido)}</Dado>
          <Dado rotulo="Protocolo CEUA">
            <span className="pedidos__protocolo">{p.protocoloCeua}</span>
          </Dado>
          {!paraQuemPediu && <Dado rotulo="E-mail">{p.email}</Dado>}
          {/* quem pediu já lê o motivo embaixo da situação */}
          {!paraQuemPediu && p.motivoRecusa && (
            <Dado rotulo="Motivo da recusa" largo>
              {p.motivoRecusa}
            </Dado>
          )}
          <Dado rotulo="Observações" largo>
            {p.observacoes ?? '—'}
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
  pedido: p,
  equipe,
  aoFechar,
}: {
  pedido: Pedido
  equipe: AcoesDaEquipe
  aoFechar: () => void
}) {
  const { message } = App.useApp()
  const aprovar = useAprovarPedido()

  function aprovarAgora() {
    aprovar.mutate(p.id, {
      onSuccess: () => {
        void message.success(`Pedido #${p.id} aprovado.`)
        aoFechar()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  // o que leva o pedido adiante: aprovar o que chegou, reservar o aprovado, completar a reserva
  // que perdeu animais e entregar o reservado inteiro
  const principal =
    p.status === 'enviado' ? (
      <Botao variante="primario" loading={aprovar.isPending} onClick={aprovarAgora}>
        Aprovar
      </Botao>
    ) : recebeReserva(p) ? (
      <Botao variante="primario" onClick={() => equipe.aoReservar(p)}>
        {p.status === 'reservado' ? 'Completar reserva' : 'Reservar animais'}
      </Botao>
    ) : p.status === 'reservado' ? (
      <Botao variante="primario" onClick={() => equipe.aoEntregar(p)}>
        Registrar entrega
      </Botao>
    ) : null

  return (
    <div className="pedidos__rodape">
      <div className="pedidos__rodapeInicio">
        {podeRecusar(p.status) && (
          <Botao variante="fantasma" onClick={() => equipe.aoRecusar(p)}>
            Recusar
          </Botao>
        )}
        {/* a reserva se desfaz a qualquer momento: os animais voltam a ficar livres */}
        {p.status === 'reservado' && (
          <Botao variante="fantasma" onClick={() => equipe.aoDesfazer(p)}>
            Desfazer reserva
          </Botao>
        )}
      </div>
      <div className="pedidos__rodapeFim">
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
    <div className={largo ? 'pedidos__dado pedidos__dado--largo' : 'pedidos__dado'}>
      <dt>
        <Texto tom="rotulo">{rotulo}</Texto>
      </dt>
      <dd className={numero ? 'pedidos__numeroGrande' : undefined}>{children}</dd>
    </div>
  )
}

/**
 * O pedido para bater o olho: quem pediu e a linhagem em cima; embaixo, cada quantidade, a idade
 * e a entrega. Para quem pediu, sem o próprio nome
 */
function ResumoDoPedido({ pedido: p, comNome = true }: { pedido: Pedido; comNome?: boolean }) {
  const linhagem = `${ROTULO_ESPECIE[p.especie]} · ${p.linhagem}`
  const quantidades = [
    { rotulo: 'Machos', valor: p.machos },
    { rotulo: 'Fêmeas', valor: p.femeas },
    { rotulo: 'Qualquer sexo', valor: p.qualquer },
  ].filter(({ valor }) => valor > 0)

  return (
    <div className="pedidos__resumo">
      {comNome ? (
        <div className="pedidos__duasLinhas">
          <span className="pedidos__destaque">{p.pesquisador}</span>
          <Texto tom="secundario">{linhagem}</Texto>
        </div>
      ) : (
        <span className="pedidos__destaque">{linhagem}</span>
      )}
      <dl className="pedidos__resumoDados">
        {quantidades.map(({ rotulo, valor }) => (
          <Dado key={rotulo} rotulo={rotulo} numero>
            {valor}
          </Dado>
        ))}
        <Dado rotulo="Idade">{descreverIdade(p)}</Dado>
        <Dado rotulo="Entrega">{formatarData(p.dataEntrega)}</Dado>
      </dl>
    </div>
  )
}

/**
 * A entrega do pedido reservado: de quais caixas tirar os animais, onde eles estão de fato, e o
 * dia em que saíram, entre o dia do pedido e hoje. A API confere a idade de cada animal nesse dia
 * e o desmame: com animal fora da idade, o caminho é desfazer a reserva e reservar outros
 */
function RegistrarEntrega({
  pedido,
  aoFechar,
  aoConcluir,
  aoDesfazer,
}: {
  pedido: Pedido
  aoFechar: () => void
  aoConcluir: () => void
  aoDesfazer: () => void
}) {
  const { message } = App.useApp()
  const registrar = useRegistrarEntrega()
  const [form] = Form.useForm<{ dtEntrega: DataISO }>()
  const falha = useFalhaDoFormulario(form, ['dtEntrega'])
  // animal fora da idade na data real: a mensagem diz quais, e o aviso oferece desfazer a reserva.
  // Sem o desmame registrado, a mensagem já diz o que fazer, e é na ficha da caixa
  const [foraDaIdade, setForaDaIdade] = useState(false)

  function salvar({ dtEntrega }: { dtEntrega: DataISO }) {
    falha.limpar()
    setForaDaIdade(false)
    registrar.mutate(
      { idPedido: pedido.id, dtEntrega },
      {
        onSuccess: ({ caixasLiberadas }) => {
          const liberadas = descreverCaixasLiberadas(caixasLiberadas)
          void message.success(
            [`Entrega do pedido #${pedido.id} registrada.`, liberadas].filter(Boolean).join(' '),
          )
          aoConcluir()
        },
        onError: (erro) => {
          setForaDaIdade(erro instanceof ErroDeApi && erro.codigo === 'IDADE_FORA_DA_FAIXA')
          falha.mostrar(erro)
        },
      },
    )
  }

  return (
    <Modal
      open
      title={`Registrar a entrega do pedido #${pedido.id}`}
      okText="Registrar entrega"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={registrar.isPending}
    >
      <Texto>
        {descreverQuantidadeEEspecie(pedido)} ({descreverSexos(pedido)}), protocolo CEUA{' '}
        <span className="pedidos__protocolo">{pedido.protocoloCeua}</span>.
      </Texto>
      <RetiradaDaEntrega idPedido={pedido.id} />
      {falha.erro && (
        <div className="pedidos__aviso">
          {/* o botão vai embaixo da mensagem: ao lado, ele a espremia numa coluna estreita */}
          {foraDaIdade ? (
            <Aviso tom="erro" titulo={falha.erro}>
              <Botao variante="secundario" onClick={aoDesfazer}>
                Desfazer reserva
              </Botao>
            </Aviso>
          ) : (
            <Aviso tom="erro" titulo={falha.erro} />
          )}
        </div>
      )}
      <Form
        form={form}
        name="entrega"
        layout="vertical"
        onFinish={salvar}
        initialValues={{ dtEntrega: hoje() }}
      >
        <Form.Item
          name="dtEntrega"
          label="Data da entrega"
          rules={[
            { required: true, message: 'Informe a data' },
            {
              validator: (_, valor?: DataISO) =>
                !valor || valor <= hoje()
                  ? Promise.resolve()
                  : Promise.reject(new Error('A entrega não pode ser no futuro')),
            },
            {
              validator: (_, valor?: DataISO) =>
                !valor || valor >= pedido.dataPedido
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        `A entrega não pode ser antes do pedido (${formatarData(pedido.dataPedido)})`,
                      ),
                    ),
            },
          ]}
        >
          <CampoDeData min={pedido.dataPedido} max={hoje()} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/**
 * A recusa: o motivo vai para quem pediu. O pedido reservado também se recusa, e os animais dele
 * voltam a ficar livres nas caixas onde estão
 */
function RecusarPedido({
  pedido,
  aoFechar,
  aoConcluir,
}: {
  pedido: Pedido
  aoFechar: () => void
  aoConcluir: () => void
}) {
  const { message } = App.useApp()
  const recusar = useRecusarPedido()
  const [form] = Form.useForm<{ motivo: string }>()
  const falha = useFalhaDoFormulario(form, ['motivo'])

  function salvar({ motivo }: { motivo: string }) {
    falha.limpar()
    recusar.mutate(
      { idPedido: pedido.id, motivo },
      {
        onSuccess: ({ soltos }) => {
          void message.success(
            [`Pedido #${pedido.id} recusado.`, voltaramAFicarLivres(soltos)]
              .filter(Boolean)
              .join(' '),
          )
          aoConcluir()
        },
        onError: falha.mostrar,
      },
    )
  }

  return (
    <Modal
      open
      title={`Recusar o pedido #${pedido.id}`}
      okText="Recusar"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={recusar.isPending}
    >
      <Pilha>
        {pedido.status === 'reservado' && (
          <Aviso
            tom="atencao"
            titulo="Os animais reservados para este pedido voltam a ficar livres, nas caixas onde estão."
          />
        )}
        {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
        <Texto>O motivo aparece para quem pediu.</Texto>
        <Form form={form} name="recusa" layout="vertical" onFinish={salvar}>
          <Form.Item
            name="motivo"
            label="Motivo"
            rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
          >
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Pilha>
    </Modal>
  )
}

/**
 * Desfazer a reserva, com falta ou sem: os animais voltam a ficar livres onde estão, e o pedido
 * volta a aguardar animais para reservar de novo
 */
function DesfazerReserva({
  pedido,
  aoFechar,
  aoConcluir,
}: {
  pedido: Pedido
  aoFechar: () => void
  aoConcluir: () => void
}) {
  const { message } = App.useApp()
  const desfazer = useDesfazerReserva()
  const falta = pedido.reservaEmFalta

  function confirmar() {
    desfazer.mutate(pedido.id, {
      onSuccess: ({ soltos }) => {
        void message.success(
          [`Reserva do pedido #${pedido.id} desfeita.`, voltaramAFicarLivres(soltos)]
            .filter(Boolean)
            .join(' '),
        )
        aoConcluir()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  return (
    <Modal
      open
      title={`Desfazer a reserva do pedido #${pedido.id}`}
      okText="Desfazer reserva"
      cancelText="Cancelar"
      onOk={confirmar}
      onCancel={aoFechar}
      confirmLoading={desfazer.isPending}
    >
      <Pilha>
        {falta && <Texto>A reserva deste pedido está em falta: {descreverQueFalta(falta)}.</Texto>}
        <Texto>
          Os animais reservados voltam a ficar livres, nas caixas onde estão, e o pedido volta para
          Aguardando animais; depois, é só reservar de novo. Quem pediu não é avisado.
        </Texto>
      </Pilha>
    </Modal>
  )
}
