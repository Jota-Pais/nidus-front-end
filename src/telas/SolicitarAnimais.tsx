import { DownOutlined, RightOutlined } from '@ant-design/icons'
import {
  App,
  Descriptions,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Table,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { useState } from 'react'
import { usePerfil } from '@/auth/contexto'
import {
  Aviso,
  Botao,
  CabecalhoDaTela,
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
  useCatalogo,
  useConferirViabilidade,
  useCriarSolicitacao,
  useDevolverParaAnalise,
  useRecusarSolicitacao,
  useRegistrarEntrega,
  useSolicitacoes,
} from '@/dominio/consultas'
import {
  FILTROS_DE_SOLICITACAO,
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

const STATUS: Record<StatusSolicitacao, { rotulo: string; tom: TomDeEtiqueta }> = {
  rascunho: { rotulo: 'Rascunho', tom: 'neutro' },
  enviada: { rotulo: 'Aguardando análise', tom: 'informacao' },
  em_analise: { rotulo: 'Em análise', tom: 'informacao' },
  aprovada: { rotulo: 'Aprovada', tom: 'sucesso' },
  recusada: { rotulo: 'Recusada', tom: 'erro' },
  ajustada: { rotulo: 'Ajustada', tom: 'atencao' },
  em_atendimento: { rotulo: 'Em atendimento', tom: 'institucional' },
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
  const [atendendo, setAtendendo] = useState<Solicitacao | null>(null)
  const [entregando, setEntregando] = useState<Solicitacao | null>(null)
  const [recusando, setRecusando] = useState<Solicitacao | null>(null)
  const [devolvendo, setDevolvendo] = useState<Solicitacao | null>(null)
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
  const colunasDaTabela = pesquisador
    ? colunasDeQuemPediu(telaLarga)
    : colunasDaEquipe(
        {
          aoAtender: setAtendendo,
          aoEntregar: setEntregando,
          aoRecusar: setRecusando,
          aoDevolver: setDevolvendo,
        },
        telaLarga,
      )
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
                    <Entrada type="date" min={hoje()} />
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
            columns={colunasDaTabela}
            expandable={{
              expandedRowRender: (s) => <Detalhes solicitacao={s} equipe={!pesquisador} />,
              expandIcon: ({ expanded, onExpand, record }) => (
                <button
                  type="button"
                  className="solicitacao__seta"
                  aria-label={expanded ? 'Esconder detalhes' : 'Ver detalhes'}
                  aria-expanded={expanded}
                  onClick={(evento) => onExpand(record, evento)}
                >
                  {expanded ? <DownOutlined /> : <RightOutlined />}
                </button>
              ),
            }}
          />
        </Secao>
      </EstadoDaConsulta>
      {atendendo && (
        <AtenderPedido
          solicitacao={atendendo}
          aoFechar={() => setAtendendo(null)}
          aoRecusar={() => {
            setAtendendo(null)
            setRecusando(atendendo)
          }}
        />
      )}
      {entregando && (
        <RegistrarEntrega solicitacao={entregando} aoFechar={() => setEntregando(null)} />
      )}
      {recusando && (
        <RecusarSolicitacao solicitacao={recusando} aoFechar={() => setRecusando(null)} />
      )}
      {devolvendo && (
        <DevolverParaAnalise solicitacao={devolvendo} aoFechar={() => setDevolvendo(null)} />
      )}
    </Pilha>
  )
}

interface AcoesDaEquipe {
  aoAtender: (s: Solicitacao) => void
  aoEntregar: (s: Solicitacao) => void
  aoRecusar: (s: Solicitacao) => void
  aoDevolver: (s: Solicitacao) => void
}

/**
 * Embaixo da situação, para a equipe: a reserva em falta, quando decidiu, ou até quando tem de
 * responder
 */
function situacaoParaAEquipe(s: Solicitacao): string | null {
  if (s.reservaEmFalta) {
    return `Reserva em falta: ${s.reservaEmFalta.m} M e ${s.reservaEmFalta.f} F`
  }
  if (s.dataRecusa) return `Recusada em ${formatarData(s.dataRecusa)}`
  if (s.dataAceite) return `Aceita em ${formatarData(s.dataAceite)}`
  if (s.prazoResposta) return `Responder até ${formatarData(s.prazoResposta)}`
  return null
}

/** Embaixo da situação, para quem pediu: por que recusaram, quando aceitaram, ou até quando sai a resposta */
function situacaoParaQuemPediu(s: Solicitacao): string | null {
  if (s.status === 'recusada') {
    return s.motivoRecusa ? `Motivo: ${s.motivoRecusa}` : null
  }
  if (s.dataAceite) return `Aceita em ${formatarData(s.dataAceite)}`
  if (s.prazoResposta) return `Resposta até ${formatarData(s.prazoResposta)}`
  return null
}

function Situacao({
  solicitacao: s,
  embaixo,
}: {
  solicitacao: Solicitacao
  embaixo: string | null
}) {
  return (
    <div className="solicitacao__duasLinhas">
      <Etiqueta tom={STATUS[s.status].tom}>{STATUS[s.status].rotulo}</Etiqueta>
      {embaixo && <Texto tom="secundario">{embaixo}</Texto>}
    </div>
  )
}

/** A data de entrega, sem se partir */
function Entrega({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return <span className="solicitacao__semQuebra">{formatarData(s.dataEntrega)}</span>
}

/** Os animais pedidos e a idade, sem o nome de quem pediu */
function Animais({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <div className="solicitacao__duasLinhas solicitacao__pedido">
      <span>{`${s.linhagem} · ${descreverAnimais(s)}`}</span>
      <Texto tom="secundario">{`${descreverIdade(s)} de idade`}</Texto>
    </div>
  )
}

function Pedido({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <div className="solicitacao__duasLinhas solicitacao__pedido">
      <span title={s.pesquisador}>{s.pesquisador}</span>
      <Texto tom="secundario">{`${s.linhagem} · ${descreverAnimais(s)}`}</Texto>
    </div>
  )
}

function AcaoDaEquipe({
  solicitacao: s,
  equipe,
}: {
  solicitacao: Solicitacao
  equipe: AcoesDaEquipe
}) {
  if (s.status === 'aprovada') {
    const entregar = (
      <Botao variante="fantasma" onClick={() => equipe.aoEntregar(s)}>
        Registrar entrega
      </Botao>
    )

    if (!s.reservaEmFalta) return entregar

    // a ninhada reservada ficou com menos animais: a equipe devolve o pedido para alocar de novo
    return (
      <div className="solicitacao__acoesDoPedido">
        <Botao variante="fantasma" onClick={() => equipe.aoDevolver(s)}>
          Devolver para análise
        </Botao>
        {entregar}
      </div>
    )
  }
  if (s.status === 'enviada') {
    // atender é o que se faz com o pedido que chega; recusar fica embaixo, sem destaque
    return (
      <div className="solicitacao__acoesDoPedido">
        <Botao onClick={() => equipe.aoAtender(s)}>Atender</Botao>
        <Botao variante="fantasma" onClick={() => equipe.aoRecusar(s)}>
          Recusar
        </Botao>
      </div>
    )
  }
  return null
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
 * Para quem pediu: quando chega, se aceitaram e o que pediu. O resto fica na setinha. Na tela
 * estreita a coluna única ordena pela entrega, que é a data no topo de cada pedido
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
              <Situacao solicitacao={s} embaixo={situacaoParaQuemPediu(s)} />
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
      render: (_, s) => <Situacao solicitacao={s} embaixo={situacaoParaQuemPediu(s)} />,
    },
    {
      title: 'O que pediu',
      render: (_, s) => <Animais solicitacao={s} />,
    },
  ]
}

/**
 * Para a equipe: quando pediram, a situação, quem pediu e o quê, e o que fazer com o pedido. Na
 * tela estreita a coluna única ordena pela data do pedido, que é a data no topo de cada um
 */
function colunasDaEquipe(equipe: AcoesDaEquipe, telaLarga: boolean): TableColumnsType<Solicitacao> {
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
              <Situacao solicitacao={s} embaixo={situacaoParaAEquipe(s)} />
            </div>
            <Pedido solicitacao={s} />
            <AcaoDaEquipe solicitacao={s} equipe={equipe} />
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
      width: 200,
      render: (_, s) => <Situacao solicitacao={s} embaixo={situacaoParaAEquipe(s)} />,
    },
    {
      title: 'Quem pediu e o quê',
      render: (_, s) => <Pedido solicitacao={s} />,
    },
    {
      title: '',
      // cabe o "Devolver para análise" do pedido com a reserva em falta
      width: 220,
      render: (_, s) => <AcaoDaEquipe solicitacao={s} equipe={equipe} />,
    },
  ]
}

const ROTULO_ESPECIE: Record<CodigoEspecie, string> = { rato: 'Rato', camundongo: 'Camundongo' }

function Detalhes({ solicitacao: s, equipe }: { solicitacao: Solicitacao; equipe: boolean }) {
  const protocolo = {
    key: 'ceua',
    label: 'Protocolo CEUA',
    children: <span className="solicitacao__protocolo">{s.protocoloCeua}</span>,
  }
  const especie = { key: 'especie', label: 'Espécie', children: ROTULO_ESPECIE[s.especie] }
  const observacoes = { key: 'observacoes', label: 'Observações', children: s.observacoes ?? '—' }

  // Quem pediu já vê na linha a entrega, a idade e o motivo da recusa
  const itens = equipe
    ? [
        { key: 'id', label: 'Nº do pedido', children: `#${s.id}` },
        { key: 'email', label: 'E-mail', children: s.email },
        especie,
        { key: 'idade', label: 'Idade', children: descreverIdade(s) },
        {
          key: 'entrega',
          label: 'Entrega',
          children: formatarData(s.dataEntrega),
        },
        protocolo,
        ...(s.motivoRecusa
          ? [{ key: 'motivo', label: 'Motivo da recusa', children: s.motivoRecusa }]
          : []),
        observacoes,
      ]
    : [
        { key: 'pedido', label: 'Pedido em', children: formatarData(s.dataSolicitacao) },
        protocolo,
        especie,
        observacoes,
      ]

  return <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={itens} />
}

function RegistrarEntrega({
  solicitacao,
  aoFechar,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
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
          aoFechar()
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
          <Input type="date" max={hoje()} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function RecusarSolicitacao({
  solicitacao,
  aoFechar,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
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
          aoFechar()
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
      <Texto>
        {descreverAnimais(solicitacao)} de {solicitacao.linhagem}, pedido por{' '}
        {solicitacao.pesquisador}. O motivo aparece para quem pediu.
      </Texto>
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

function DevolverParaAnalise({
  solicitacao,
  aoFechar,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
}) {
  const { message } = App.useApp()
  const devolver = useDevolverParaAnalise()
  const falta = solicitacao.reservaEmFalta

  function confirmar() {
    devolver.mutate(solicitacao.id, {
      onSuccess: () => {
        void message.success(`Solicitação #${solicitacao.id} devolvida para análise.`)
        aoFechar()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  return (
    <Modal
      open
      title={`Devolver para análise · #${solicitacao.id}`}
      okText="Devolver para análise"
      cancelText="Cancelar"
      onOk={confirmar}
      onCancel={aoFechar}
      confirmLoading={devolver.isPending}
    >
      <Pilha>
        {falta && (
          <Texto>
            A ninhada reservada para este pedido ficou com menos animais: faltam até {falta.m} M e{' '}
            {falta.f} F.
          </Texto>
        )}
        <Texto>
          As reservas do pedido são canceladas e ele volta para Aguardando análise, com 14 dias para a
          resposta a partir de hoje. Depois, aloque o pedido inteiro de novo. Quem pediu não é avisado.
        </Texto>
      </Pilha>
    </Modal>
  )
}
