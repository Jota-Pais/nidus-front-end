import { App, Form, Input, InputNumber, Select, Table } from 'antd'
import { usePerfil } from '@/auth/contexto'
import { Botao, CabecalhoDaTela, Etiqueta, Pilha, Secao, Texto } from '@/componentes'
import type { TomDeEtiqueta } from '@/componentes'
import { useCatalogo, useCriarSolicitacao, useProjetos, useSolicitacoes } from '@/dominio/consultas'
import type { NovaSolicitacao } from '@/dominio/consultas'
import type { CodigoEspecie, Cronograma, Solicitacao, StatusSolicitacao } from '@/dominio/tipos'
import { formatarData } from '@/lib/data'
import './Solicitacao.css'

const ROTULO_CRONOGRAMA: Record<Cronograma, string> = {
  unica: 'Cota única',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  avulsas: 'Avulsas',
}

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

interface Campos extends Omit<NovaSolicitacao, 'idLinhagem'> {
  especie: CodigoEspecie
  idLinhagem: number
}

/** O pedido do pesquisador: no lugar do Word por e-mail, um formulário que já chega validado */
export function SolicitarAnimais() {
  const { message } = App.useApp()
  const { usuario } = usePerfil()
  const [form] = Form.useForm<Campos>()
  const projetos = useProjetos()
  const catalogo = useCatalogo()
  const solicitacoes = useSolicitacoes()
  const criar = useCriarSolicitacao()

  const especie = Form.useWatch('especie', form)
  const machos = Form.useWatch('machos', form) ?? 0
  const femeas = Form.useWatch('femeas', form) ?? 0
  const linhagens =
    catalogo.data?.especies
      .find((e) => e.codigo === especie)
      ?.linhagens.filter((l) => l.ativa)
      .map((l) => ({ value: l.id, label: l.nome })) ?? []

  function enviar(campos: Campos) {
    const pedido: NovaSolicitacao = {
      idProjeto: campos.idProjeto,
      idLinhagem: campos.idLinhagem,
      machos: campos.machos,
      femeas: campos.femeas,
      idade: campos.idade,
      dataEntrega: campos.dataEntrega,
      cronograma: campos.cronograma,
    }
    criar.mutate(pedido, {
      onSuccess: ({ id }) => {
        void message.success(`Solicitação #${id} enviada. A equipe técnica vai analisar.`)
        form.resetFields()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  return (
    <Pilha>
      <CabecalhoDaTela titulo="Solicitar animais" />

      <Secao titulo="Nova solicitação">
        <Form
          form={form}
          layout="vertical"
          onFinish={enviar}
          initialValues={{ especie: 'rato', machos: 0, femeas: 0, idade: 28, cronograma: 'unica' }}
        >
          <div className="solicitacao__blocos">
            <div className="solicitacao__bloco">
              <Texto tom="rotulo">Solicitante</Texto>
              <Form.Item label="Pesquisador">
                <Input value={usuario?.nome} disabled />
              </Form.Item>
              <Form.Item name="idProjeto" label="Projeto CEUA" rules={[{ required: true, message: 'Escolha o projeto' }]}>
                <Select
                  loading={projetos.isPending}
                  placeholder="Selecione o projeto"
                  notFoundContent="Nenhum projeto CEUA no seu nome"
                  options={(projetos.data ?? []).map((p) => ({
                    value: p.id,
                    label: `${p.numero}${p.vigente ? '' : ' (fora de vigência)'}`,
                    disabled: !p.vigente,
                  }))}
                />
              </Form.Item>
            </div>

            <div className="solicitacao__bloco">
              <Texto tom="rotulo">Animais</Texto>
              <Form.Item name="especie" label="Espécie">
                <Select
                  options={[
                    { value: 'rato', label: 'Rato' },
                    { value: 'camundongo', label: 'Camundongo' },
                  ]}
                  onChange={() => form.setFieldValue('idLinhagem', undefined)}
                />
              </Form.Item>
              <Form.Item name="idLinhagem" label="Linhagem" rules={[{ required: true, message: 'Escolha a linhagem' }]}>
                <Select options={linhagens} placeholder="Selecione a linhagem" />
              </Form.Item>
              <div className="solicitacao__linha">
                <Form.Item name="machos" label="Machos">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="femeas" label="Fêmeas">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <Texto tom="secundario">
                Total: <strong>{machos + femeas}</strong> animais
              </Texto>
            </div>

            <div className="solicitacao__bloco">
              <Texto tom="rotulo">Idade e prazo</Texto>
              <Form.Item
                name="idade"
                label="Idade na entrega (dias)"
                rules={[{ required: true, type: 'number', min: 21, message: 'A idade mínima é 21 dias' }]}
              >
                <InputNumber min={21} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="dataEntrega" label="Data de entrega" rules={[{ required: true, message: 'Informe a data' }]}>
                <Input type="date" />
              </Form.Item>
              <Form.Item name="cronograma" label="Cronograma">
                <Select
                  options={(['unica', 'semanal', 'quinzenal', 'mensal'] as const).map((valor) => ({
                    value: valor,
                    label: ROTULO_CRONOGRAMA[valor],
                  }))}
                />
              </Form.Item>
            </div>
          </div>

          <div className="solicitacao__acoes">
            <Botao variante="fantasma" onClick={() => form.resetFields()}>
              Limpar
            </Botao>
            <Botao variante="primario" htmlType="submit" loading={criar.isPending} disabled={machos + femeas === 0}>
              Enviar solicitação
            </Botao>
          </div>
        </Form>
      </Secao>

      <Secao titulo="Solicitações" semPreenchimento>
        <Table<Solicitacao>
          rowKey="id"
          loading={solicitacoes.isPending}
          dataSource={solicitacoes.data ?? []}
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: 'Nenhuma solicitação ainda.' }}
          columns={[
            { title: '#', dataIndex: 'id', width: 60 },
            { title: 'Projeto', dataIndex: 'projeto' },
            { title: 'Solicitante', dataIndex: 'solicitante' },
            { title: 'Linhagem', render: (_, s) => `${s.linhagem} (${s.especie})` },
            { title: 'Animais', render: (_, s) => `${s.machos} M · ${s.femeas} F` },
            { title: 'Idade', render: (_, s) => `${s.idade} dias` },
            { title: 'Entrega', render: (_, s) => formatarData(s.dataEntrega) },
            { title: 'Cronograma', render: (_, s) => ROTULO_CRONOGRAMA[s.cronograma] },
            {
              title: 'Situação',
              render: (_, s) => <Etiqueta tom={STATUS[s.status].tom}>{STATUS[s.status].rotulo}</Etiqueta>,
            },
          ]}
        />
      </Secao>
    </Pilha>
  )
}
