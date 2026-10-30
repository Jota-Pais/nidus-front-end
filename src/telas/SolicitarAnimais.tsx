import { App, Form, Input, InputNumber, Segmented, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
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
import { useCatalogo, useCriarSolicitacao, useSolicitacoes } from '@/dominio/consultas'
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
import {
  FORMATO_DO_PROTOCOLO,
  PECA_UM_ANIMAL,
  mascararProtocolo,
  montarPedido,
  temAnimal,
  validadorDoPedido,
} from './solicitacao.schema'
import type { CamposDoPedido } from './solicitacao.schema'
import './Solicitacao.css'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Rato' },
  { value: 'camundongo', label: 'Camundongo' },
]

const STATUS: Record<StatusSolicitacao, { rotulo: string; tom: TomDeEtiqueta }> = {
  rascunho: { rotulo: 'Rascunho', tom: 'neutro' },
  enviada: { rotulo: 'Aguardando análise', tom: 'acento' },
  em_analise: { rotulo: 'Em análise', tom: 'acento' },
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
  const [form] = Form.useForm<CamposDoPedido>()
  const catalogo = useCatalogo()
  const solicitacoes = useSolicitacoes()
  const criar = useCriarSolicitacao()
  const falha = useFalhaDoFormulario(form, CAMPOS_COM_ERRO)

  const especie = Form.useWatch('especie', form)
  const total = totalDeAnimais({
    machos: Form.useWatch('machos', form),
    femeas: Form.useWatch('femeas', form),
    qualquer: Form.useWatch('qualquer', form),
  })
  // O pesquisador só recebe os pedidos dele: a coluna de quem pediu é da equipe
  const colunasDaTabela = colunas(perfil !== 'pesquisador')
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
      <CabecalhoDaTela titulo="Solicitar animais" />

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

            <Formulario.Campo
              name="protocoloCeua"
              rotulo="Protocolo CEUA"
              ajuda={FORMATO_DO_PROTOCOLO}
              normalize={mascararProtocolo}
              validateTrigger="onBlur"
              rules={[{ validator: validadorDoPedido('protocoloCeua') }]}
              className="solicitacao__campo--protocolo"
            >
              <Entrada className="solicitacao__protocolo" inputMode="numeric" />
            </Formulario.Campo>
          </div>

          {/* Que animal */}
          <div className="solicitacao__fileira">
            <Formulario.Campo name="especie" rotulo="Espécie">
              <Segmented<CodigoEspecie>
                options={ESPECIES}
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

          {/* Quantos. A regra da soma fica só em "machos", para o erro aparecer uma vez
              embaixo do grupo, e olha os outros dois pelas dependências */}
          <Formulario.Campo rotulo="Animais">
            <Linha espaco={16}>
              <span className="solicitacao__quantidade">
                <Form.Item
                  name="machos"
                  noStyle
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
                machos
              </span>

              <span className="solicitacao__quantidade">
                <Form.Item
                  name="femeas"
                  noStyle
                  rules={[{ validator: validadorDoPedido('quantidade') }]}
                >
                  <InputNumber {...NUMERO} aria-label="Fêmeas" />
                </Form.Item>
                fêmeas
              </span>

              <span className="solicitacao__quantidade">
                <Form.Item
                  name="qualquer"
                  noStyle
                  rules={[{ validator: validadorDoPedido('quantidade') }]}
                >
                  <InputNumber {...NUMERO} aria-label="Qualquer sexo" />
                </Form.Item>
                qualquer sexo
              </span>

              <Texto tom="secundario">
                = {total} {total === 1 ? 'animal' : 'animais'}
              </Texto>
            </Linha>
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

      <EstadoDaConsulta consulta={solicitacoes} rotulo="Carregando as solicitações…">
        <Secao titulo="Solicitações" semPreenchimento>
          <Table<Solicitacao>
            className="solicitacao__tabela"
            rowKey="id"
            dataSource={solicitacoes.data ?? []}
            pagination={false}
            scroll={{ x: larguraMinima(colunasDaTabela) }}
            locale={{ emptyText: 'Nenhuma solicitação ainda.' }}
            columns={colunasDaTabela}
          />
        </Secao>
      </EstadoDaConsulta>
    </Pilha>
  )
}

/**
 * As colunas de valor curto têm largura fixa, do tamanho do maior valor que cabe nelas. As
 * observações, que são texto livre, ficam com o espaço que sobra e terminam em reticências
 */
const OBSERVACOES_NO_MINIMO = 200

function colunas(comPesquisador: boolean): TableColumnsType<Solicitacao> {
  return [
    { title: '#', dataIndex: 'id', width: 56 },
    {
      title: 'Situação',
      width: 170,
      render: (_, s) => <Etiqueta tom={STATUS[s.status].tom}>{STATUS[s.status].rotulo}</Etiqueta>,
    },
    ...(comPesquisador
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
    { title: 'Linhagem', width: 170, render: (_, s) => `${s.linhagem} · ${s.especie}` },
    { title: 'Animais', width: 230, render: (_, s) => descreverAnimais(s) },
    { title: 'Idade', width: 130, render: (_, s) => descreverIdade(s) },
    {
      // A data e o cronograma juntos: uma coluna a menos, e a tabela cabe sem rolar de lado
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
      width: 210,
      render: (_, s) => <span className="solicitacao__protocolo">{s.protocoloCeua}</span>,
      responsive: ['lg'],
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      ellipsis: true,
      render: (observacoes: string | null) => observacoes ?? '—',
    },
  ]
}

/** Abaixo disso a tabela rola de lado, em vez de espremer as colunas */
function larguraMinima(lista: TableColumnsType<Solicitacao>): number {
  const fixas = lista.reduce((soma, c) => soma + (typeof c.width === 'number' ? c.width : 0), 0)
  return fixas + OBSERVACOES_NO_MINIMO
}
