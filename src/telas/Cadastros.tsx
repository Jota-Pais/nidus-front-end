import { App, Form, Input, InputNumber, Modal, Select, Switch, Table, Tabs } from 'antd'
import { useState } from 'react'
import { Botao, CabecalhoDaTela, Etiqueta, Linha, Pilha, Secao } from '@/componentes'
import {
  useCatalogo,
  useProjetos,
  useSalvarLinhagem,
  useSalvarProjeto,
  useUsuarios,
} from '@/dominio/consultas'
import type { DadosDoProjeto } from '@/dominio/consultas'
import { formatarProtocolo } from '@/dominio/protocolo'
import type { Catalogo, Projeto, SituacaoDoProjeto } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { formatarData } from '@/lib/data'
import { CampoDoProtocolo } from './CampoDoProtocolo'

const SITUACOES: { value: SituacaoDoProjeto; label: string }[] = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'suspenso', label: 'Suspenso' },
]

/** Projetos CEUA e linhagens: o que antes só entrava pela carga inicial */
export function Cadastros() {
  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Gestão"
        titulo="Cadastros"
        descricao="Projetos CEUA e linhagens. Nada é apagado: projeto encerrado vira vencido ou suspenso, e linhagem fora de uso fica inativa."
      />
      <Tabs
        items={[
          { key: 'projetos', label: 'Projetos CEUA', children: <Projetos /> },
          { key: 'linhagens', label: 'Linhagens', children: <Linhagens /> },
        ]}
      />
    </Pilha>
  )
}

function Projetos() {
  const projetos = useProjetos()
  const [editando, setEditando] = useState<Projeto | 'novo' | null>(null)

  return (
    <Secao
      semPreenchimento
      acoes={
        <Botao variante="primario" onClick={() => setEditando('novo')}>
          Novo projeto
        </Botao>
      }
    >
      <EstadoDaConsulta consulta={projetos} rotulo="Carregando os projetos…">
        <Table<Projeto>
          rowKey="id"
          dataSource={projetos.data ?? []}
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: 'Nenhum projeto cadastrado.' }}
          columns={[
            { title: 'Número', dataIndex: 'numero' },
            { title: 'Título', dataIndex: 'titulo' },
            { title: 'Responsável', dataIndex: 'responsavel' },
            {
              title: 'Vigência',
              render: (_, p) =>
                `${formatarData(p.dtVigenciaInicio)} a ${formatarData(p.dtVigenciaFim)}`,
            },
            { title: 'Cota', dataIndex: 'cotaAutorizada' },
            {
              title: 'Situação',
              render: (_, p) => (
                <Etiqueta tom={p.vigente ? 'sucesso' : 'neutro'}>
                  {SITUACOES.find((s) => s.value === p.situacao)?.label ?? p.situacao}
                </Etiqueta>
              ),
            },
            {
              title: '',
              render: (_, p) => (
                <Botao variante="fantasma" onClick={() => setEditando(p)}>
                  Editar
                </Botao>
              ),
            },
          ]}
        />
      </EstadoDaConsulta>
      {editando && (
        <FormularioDoProjeto
          projeto={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      )}
    </Secao>
  )
}

function FormularioDoProjeto({
  projeto,
  aoFechar,
}: {
  projeto: Projeto | null
  aoFechar: () => void
}) {
  const { message } = App.useApp()
  const usuarios = useUsuarios()
  const salvar = useSalvarProjeto()
  const [form] = Form.useForm<DadosDoProjeto>()

  const responsaveis = (usuarios.data ?? [])
    .filter((u) => u.ativo)
    .map((u) => ({ value: u.id, label: `${u.nome} (${u.email})` }))

  function enviar(campos: DadosDoProjeto) {
    // Na forma da API mesmo quando o Enter envia antes de o campo do número perder o foco
    const dados = { ...campos, numero: formatarProtocolo(campos.numero) }

    salvar.mutate(
      { id: projeto?.id ?? null, dados },
      {
        onSuccess: () => {
          void message.success(`Projeto ${dados.numero} salvo.`)
          aoFechar()
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Modal
      open
      title={projeto ? `Editar projeto · ${projeto.numero}` : 'Novo projeto CEUA'}
      okText="Salvar"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={enviar}
        initialValues={
          projeto
            ? {
                numero: projeto.numero,
                titulo: projeto.titulo,
                idUsuarioResponsavel: projeto.idUsuarioResponsavel,
                dtVigenciaInicio: projeto.dtVigenciaInicio,
                dtVigenciaFim: projeto.dtVigenciaFim,
                cotaAutorizada: projeto.cotaAutorizada,
                situacao: projeto.situacao,
              }
            : { situacao: 'vigente', cotaAutorizada: 0 }
        }
      >
        <CampoDoProtocolo name="numero" rotulo="Número" />
        <Form.Item
          name="titulo"
          label="Título"
          rules={[{ required: true, whitespace: true, message: 'Informe o título' }]}
        >
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item
          name="idUsuarioResponsavel"
          label="Responsável"
          rules={[{ required: true, message: 'Escolha o responsável' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={responsaveis}
            loading={usuarios.isPending}
          />
        </Form.Item>
        <Linha espaco={12}>
          <Form.Item
            name="dtVigenciaInicio"
            label="Início da vigência"
            rules={[{ required: true, message: 'Data' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="dtVigenciaFim"
            label="Fim da vigência"
            rules={[{ required: true, message: 'Data' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="cotaAutorizada"
            label="Cota autorizada"
            rules={[{ required: true, message: 'Cota' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="situacao" label="Situação" rules={[{ required: true }]}>
            <Select options={SITUACOES} style={{ width: 130 }} />
          </Form.Item>
        </Linha>
      </Form>
    </Modal>
  )
}

function Linhagens() {
  const catalogo = useCatalogo()

  return (
    <EstadoDaConsulta consulta={catalogo} rotulo="Carregando as linhagens…">
      <Pilha>
        {(catalogo.data?.especies ?? []).map((especie) => (
          <LinhagensDaEspecie key={especie.id} especie={especie} />
        ))}
      </Pilha>
    </EstadoDaConsulta>
  )
}

function LinhagensDaEspecie({ especie }: { especie: Catalogo['especies'][number] }) {
  const { message } = App.useApp()
  const salvar = useSalvarLinhagem()
  const [nome, setNome] = useState('')

  function aviso(texto: string) {
    return {
      onSuccess: () => void message.success(texto),
      onError: (erro: Error) => void message.error(erro.message),
    }
  }

  function adicionar() {
    const limpo = nome.trim()
    if (limpo === '') return
    salvar.mutate(
      { tipo: 'criar', idEspecie: especie.id, nome: limpo },
      {
        onSuccess: () => {
          void message.success(`Linhagem ${limpo} cadastrada.`)
          setNome('')
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Secao
      titulo={especie.nome}
      semPreenchimento
      acoes={
        <Linha espaco={8}>
          <Input
            placeholder="Nova linhagem"
            value={nome}
            maxLength={60}
            onChange={(evento) => setNome(evento.target.value)}
            onPressEnter={adicionar}
            style={{ width: 200 }}
          />
          <Botao onClick={adicionar} loading={salvar.isPending} disabled={nome.trim() === ''}>
            Adicionar
          </Botao>
        </Linha>
      }
    >
      <Table
        rowKey="id"
        dataSource={especie.linhagens}
        pagination={false}
        columns={[
          { title: 'Linhagem', dataIndex: 'nome' },
          {
            title: 'Ativa',
            width: 90,
            render: (_, linhagem) => (
              <Switch
                checked={linhagem.ativa}
                onChange={(ativa) =>
                  salvar.mutate(
                    { tipo: 'alterar', id: linhagem.id, dados: { ativa } },
                    aviso(`${linhagem.nome} ${ativa ? 'reativada' : 'inativada'}.`),
                  )
                }
              />
            ),
          },
        ]}
      />
    </Secao>
  )
}
