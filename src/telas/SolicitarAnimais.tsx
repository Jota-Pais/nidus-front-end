import { App, Form, Input, InputNumber, Modal, Segmented, Select, Table } from 'antd'
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
  Linha,
  Pilha,
  Secao,
  Texto,
} from '@/componentes'
import type { TomDeEtiqueta } from '@/componentes'
import {
  useCatalogo,
  useCriarSolicitacao,
  useEstoque,
  useRecusarSolicitacao,
  useRegistrarEntrega,
  useSolicitacoes,
} from '@/dominio/consultas'
import {
  CRONOGRAMAS_DO_PEDIDO,
  ROTULO_CRONOGRAMA,
  descreverAnimais,
  descreverIdade,
  totalDeAnimais,
} from '@/dominio/solicitacao'
import type { CodigoEspecie, Solicitacao, StatusSolicitacao } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { formatarData, hoje } from '@/lib/data'
import { CampoDeIdade } from './CampoDeIdade'
import { CampoDoProtocolo } from './CampoDoProtocolo'
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
  aprovada: { rotulo: 'Caixas alocadas', tom: 'sucesso' },
  recusada: { rotulo: 'Recusada', tom: 'erro' },
  ajustada: { rotulo: 'Ajustada', tom: 'atencao' },
  em_atendimento: { rotulo: 'Em atendimento', tom: 'institucional' },
  concluida: { rotulo: 'Entregue', tom: 'neutro' },
  cancelada: { rotulo: 'Cancelada', tom: 'neutro' },
}

/** Os números do pedido: sem setas, só inteiros, teclado numérico no celular */
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
  'cronograma',
  'observacoes',
]

/** Onde a API pode apontar erro. O primeiro recebe o foco quando o erro não aponta campo */
const CAMPOS_COM_ERRO = ['nomePesquisador', 'protocoloCeua', ...CAMPOS_DO_PEDIDO]

/** O pedido do pesquisador: no lugar do Word por e-mail, um formulário que já chega validado */
export function SolicitarAnimais() {
  const { message } = App.useApp()
  const { usuario, perfil } = usePerfil()
  const pesquisador = perfil === 'pesquisador'
  const [form] = Form.useForm<CamposDoPedido>()
  const catalogo = useCatalogo()
  const solicitacoes = useSolicitacoes()
  const criar = useCriarSolicitacao()
  const falha = useFalhaDoFormulario(form, CAMPOS_COM_ERRO)
  const [entregando, setEntregando] = useState<Solicitacao | null>(null)
  const [recusando, setRecusando] = useState<Solicitacao | null>(null)

  const especie = Form.useWatch('especie', form)
  const machos = Form.useWatch('machos', form) ?? 0
  const femeas = Form.useWatch('femeas', form) ?? 0
  const total = totalDeAnimais({ machos, femeas, qualquer: Form.useWatch('qualquer', form) })
  const idLinhagem = Form.useWatch('idLinhagem', form)
  const estoque = useEstoque(especie)
  const daLinhagem = estoque.data?.linhagens.find((l) => l.idLinhagem === idLinhagem)
  const passaDoEstoque =
    daLinhagem !== undefined &&
    (machos > daLinhagem.total.m ||
      femeas > daLinhagem.total.f ||
      total > daLinhagem.total.m + daLinhagem.total.f)
  // O pesquisador só recebe os pedidos dele: a coluna de quem pediu e as ações são da equipe
  const colunasDaTabela = colunas(
    pesquisador ? undefined : { aoEntregar: setEntregando, aoRecusar: setRecusando },
  )
  const linhagens =
    catalogo.data?.especies
      .find((e) => e.codigo === especie)
      ?.linhagens.filter((l) => l.ativa)
      .map((l) => ({ value: l.id, label: l.nome })) ?? []

  function enviar(campos: CamposDoPedido) {
    falha.limpar()
    criar.mutate(montarPedido(campos), {
      onSuccess: ({ id }) => {
        void message.success(`Solicitação #${id} enviada. A equipe técnica vai analisar.`)
        form.resetFields(CAMPOS_DO_PEDIDO)
      },
      onError: falha.mostrar,
    })
  }

  return (
    <Pilha>
      <CabecalhoDaTela titulo={pesquisador ? 'Solicitar animais' : 'Solicitações'} />

      {pesquisador && (
        <Secao>
          <Formulario<CamposDoPedido>
            form={form}
            onFinish={enviar}
            disabled={criar.isPending}
            initialValues={{ especie: 'rato', modoIdade: 'faixa', cronograma: 'unica' }}
          >
            {falha.erro && (
              <div className="solicitacao__aviso">
                <Aviso tom="erro" titulo={falha.erro} />
              </div>
            )}

            {/* Quem pede: o e-mail é o da conta, mostrado como texto porque não se muda */}
            <div className="solicitacao__fileira">
              <Formulario.Campo
                name="nomePesquisador"
                rotulo="Pesquisador"
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
                <Select options={linhagens} placeholder="Selecione" loading={catalogo.isPending} />
              </Formulario.Campo>

              <CampoDeIdade />
            </div>

            {/* Quantos. Cada número é um item com nome, para o antd ligar o erro ao campo e o
                leitor de tela o ler. A regra da soma fica só em "machos", para sair uma vez, e
                olha os outros dois pelas dependências */}
            <Formulario.Campo rotulo="Animais">
              <Linha espaco={16} estilo={{ alignItems: 'flex-start' }}>
                <span className="solicitacao__quantidade">
                  <Form.Item
                    name="machos"
                    className="solicitacao__item"
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
                    <InputNumber {...NUMERO} aria-label="Machos" />
                  </Form.Item>
                  <span className="solicitacao__unidade">machos</span>
                </span>

                <span className="solicitacao__quantidade">
                  <Form.Item
                    name="femeas"
                    className="solicitacao__item"
                    rules={[{ validator: validadorDoPedido('quantidade') }]}
                  >
                    <InputNumber {...NUMERO} aria-label="Fêmeas" />
                  </Form.Item>
                  <span className="solicitacao__unidade">fêmeas</span>
                </span>

                <span className="solicitacao__quantidade">
                  <Form.Item
                    name="qualquer"
                    className="solicitacao__item"
                    rules={[{ validator: validadorDoPedido('quantidade') }]}
                  >
                    <InputNumber {...NUMERO} aria-label="Qualquer sexo" />
                  </Form.Item>
                  <span className="solicitacao__unidade">qualquer sexo</span>
                </span>

                <Texto tom="secundario" className="solicitacao__unidade">
                  = {total} {total === 1 ? 'animal' : 'animais'}
                </Texto>
              </Linha>
              {daLinhagem && total > 0 && (
                <Texto tom="secundario">
                  {passaDoEstoque
                    ? `Atenção: hoje a colônia tem ${daLinhagem.total.m} M · ${daLinhagem.total.f} F livres de ${daLinhagem.linhagem}, contando partos previstos. O pedido pode precisar de casais novos.`
                    : `Viável: a colônia tem ${daLinhagem.total.m} M · ${daLinhagem.total.f} F livres de ${daLinhagem.linhagem}, contando partos previstos.`}
                </Texto>
              )}
            </Formulario.Campo>

            {/* Quando */}
            <div className="solicitacao__fileira">
              <Formulario.Campo
                name="dataEntrega"
                rotulo="Entrega"
                rules={[{ validator: validadorDoPedido('dataEntrega') }]}
                className="solicitacao__campo--data"
              >
                <Entrada type="date" min={hoje()} />
              </Formulario.Campo>

              <Formulario.Campo
                name="cronograma"
                rotulo="Cronograma"
                className="solicitacao__campo--cronograma"
              >
                <Select
                  options={CRONOGRAMAS_DO_PEDIDO.map((valor) => ({
                    value: valor,
                    label: ROTULO_CRONOGRAMA[valor],
                  }))}
                />
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
              <Botao variante="primario" htmlType="submit" loading={criar.isPending}>
                Enviar solicitação
              </Botao>
            </div>
          </Formulario>
        </Secao>
      )}

      <EstadoDaConsulta consulta={solicitacoes} rotulo="Carregando as solicitações…">
        <Secao titulo="Solicitações" semPreenchimento>
          <Table<Solicitacao>
            rowKey="id"
            dataSource={solicitacoes.data ?? []}
            pagination={false}
            scroll={{ x: larguraMinima(colunasDaTabela) }}
            locale={{ emptyText: 'Nenhuma solicitação ainda.' }}
            columns={colunasDaTabela}
          />
        </Secao>
      </EstadoDaConsulta>
      {entregando && <RegistrarEntrega solicitacao={entregando} aoFechar={() => setEntregando(null)} />}
      {recusando && <RecusarSolicitacao solicitacao={recusando} aoFechar={() => setRecusando(null)} />}
    </Pilha>
  )
}

/**
 * As colunas de valor curto têm largura fixa, do tamanho do maior valor que cabe nelas. As
 * observações, que são texto livre, ficam com o espaço que sobra e terminam em reticências.
 * A tabela do pesquisador cabe em 1366 px; a da equipe tem a coluna de quem pediu e rola de
 * lado, com o número e a situação presos à esquerda para a linha não se perder
 */
const OBSERVACOES_NO_MINIMO = 200

interface AcoesDaEquipe {
  aoEntregar: (s: Solicitacao) => void
  aoRecusar: (s: Solicitacao) => void
}

function colunas(equipe: AcoesDaEquipe | undefined): TableColumnsType<Solicitacao> {
  return [
    { title: '#', dataIndex: 'id', width: 56, fixed: 'left' },
    {
      title: 'Situação',
      width: 170,
      fixed: 'left',
      render: (_, s) => (
        <div className="solicitacao__duasLinhas" title={s.motivoRecusa ?? undefined}>
          <Etiqueta tom={STATUS[s.status].tom}>{STATUS[s.status].rotulo}</Etiqueta>
          {s.motivoRecusa && <Texto tom="secundario">{s.motivoRecusa}</Texto>}
        </div>
      ),
    },
    ...(equipe
      ? [
          {
            title: 'Pesquisador',
            width: 220,
            render: (_: unknown, s: Solicitacao) => (
              <div className="solicitacao__duasLinhas">
                <span>{s.pesquisador}</span>
                <Texto tom="secundario">{s.email}</Texto>
              </div>
            ),
          },
        ]
      : []),
    {
      title: 'Linhagem',
      width: 140,
      render: (_, s) => (
        <div className="solicitacao__duasLinhas">
          <span>{s.linhagem}</span>
          <Texto tom="secundario">{s.especie}</Texto>
        </div>
      ),
    },
    { title: 'Animais', width: 200, render: (_, s) => descreverAnimais(s) },
    { title: 'Idade', width: 130, render: (_, s) => descreverIdade(s) },
    {
      // A data e o cronograma juntos: uma coluna a menos
      title: 'Entrega',
      width: 130,
      render: (_, s) => (
        <div className="solicitacao__duasLinhas">
          <span>{formatarData(s.dataEntrega)}</span>
          <Texto tom="secundario">{ROTULO_CRONOGRAMA[s.cronograma]}</Texto>
        </div>
      ),
    },
    {
      title: 'CEUA',
      // os 20 caracteres do protocolo em mono, sem quebrar no hífen
      width: 230,
      render: (_, s) => <span className="solicitacao__protocolo">{s.protocoloCeua}</span>,
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      ellipsis: true,
      render: (observacoes: string | null) => observacoes ?? '—',
    },
    ...(equipe
      ? [
          {
            title: '',
            width: 170,
            render: (_: unknown, s: Solicitacao) =>
              s.status === 'aprovada' ? (
                <Botao variante="fantasma" onClick={() => equipe.aoEntregar(s)}>
                  Registrar entrega
                </Botao>
              ) : s.status === 'enviada' ? (
                <Botao variante="fantasma" onClick={() => equipe.aoRecusar(s)}>
                  Recusar
                </Botao>
              ) : null,
          },
        ]
      : []),
  ]
}

function RegistrarEntrega({ solicitacao, aoFechar }: { solicitacao: Solicitacao; aoFechar: () => void }) {
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
        {descreverAnimais(solicitacao)} de {solicitacao.linhagem} para o projeto{' '}
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

function RecusarSolicitacao({ solicitacao, aoFechar }: { solicitacao: Solicitacao; aoFechar: () => void }) {
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
        <Form.Item name="motivo" label="Motivo" rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}>
          <Input.TextArea rows={3} maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/** Abaixo disso a tabela rola de lado, em vez de espremer as colunas */
function larguraMinima(lista: TableColumnsType<Solicitacao>): number {
  const fixas = lista.reduce((soma, c) => soma + (typeof c.width === 'number' ? c.width : 0), 0)
  return fixas + OBSERVACOES_NO_MINIMO
}
