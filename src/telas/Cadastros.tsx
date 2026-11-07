import { App, Form, Input, InputNumber, Modal, Select, Switch, Table, Tabs } from 'antd'
import { useState } from 'react'
import { Botao, CabecalhoDaTela, Etiqueta, Linha, Pilha, Secao } from '@/componentes'
import {
  useCatalogo,
  useEstantes,
  useProjetos,
  useSalas,
  useSalvarEstante,
  useSalvarLinhagem,
  useSalvarProjeto,
  useSalvarSala,
  useUsuarios,
} from '@/dominio/consultas'
import type { DadosDoProjeto } from '@/dominio/consultas'
import { proximoNumeroDeEstante } from '@/dominio/estante'
import { formatarProtocolo } from '@/dominio/protocolo'
import type { Catalogo, Estante, Projeto, Sala, SituacaoDoProjeto } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { motivoDaFalha } from '@/layout/useFalhaDoFormulario'
import { formatarData } from '@/lib/data'
import { CampoDoProtocolo } from './CampoDoProtocolo'

const SITUACOES: { value: SituacaoDoProjeto; label: string }[] = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'suspenso', label: 'Suspenso' },
]

/** Projetos CEUA, linhagens, salas e estantes: o que antes só entrava pela carga inicial */
export function Cadastros() {
  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Configurações"
        titulo="Cadastros"
        descricao="Projetos CEUA, linhagens, salas e estantes. Nada é apagado: projeto encerrado vira vencido ou suspenso, linhagem fora de uso fica inativa, e sala ou estante removida sai das listas, mas fica no histórico."
      />
      <Tabs
        items={[
          { key: 'projetos', label: 'Projetos CEUA', children: <Projetos /> },
          { key: 'linhagens', label: 'Linhagens', children: <Linhagens /> },
          { key: 'salas', label: 'Salas e estantes', children: <SalasEEstantes /> },
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

/** Os quatro modelos de estante da spec do cliente (seção 1.2), todos com duas faces */
const MODELOS = [
  { fabricante: 'ALESCO', modelo: 'Modelo 1', linhas: 8, colunas: 8 },
  { fabricante: 'ALESCO', modelo: 'Modelo 2', linhas: 5, colunas: 5 },
  { fabricante: 'TECNIPLAST', modelo: 'Modelo 1', linhas: 8, colunas: 7 },
  { fabricante: 'TECNIPLAST', modelo: 'Modelo 2', linhas: 5, colunas: 4 },
]

function descricaoDoModelo(estante: {
  fabricante: string
  modelo: string
  faces: number
  linhas: number
  colunas: number
}): string {
  return `${estante.fabricante} ${estante.modelo} - ${estante.linhas} x ${estante.colunas} por face (${estante.faces * estante.linhas * estante.colunas} caixas)`
}

/**
 * Sala pode existir sem estante, e a estante nasce numa sala. Remover só tira da lista, e o
 * back só aceita a sala sem estante e a estante vazia
 */
function SalasEEstantes() {
  return (
    <Pilha>
      <Salas />
      <EstantesDasSalas />
    </Pilha>
  )
}

function Salas() {
  const { message, modal } = App.useApp()
  const salas = useSalas()
  const salvar = useSalvarSala()
  const [editando, setEditando] = useState<Sala | 'nova' | null>(null)

  function remover(sala: Sala) {
    void modal.confirm({
      title: `Remover ${sala.nome}?`,
      content: 'A sala sai das listas. Só dá para remover a sala que não tem estante.',
      okText: 'Remover',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () =>
        salvar.mutateAsync({ tipo: 'remover', id: sala.id }).then(
          () => void message.success(`${sala.nome} removida.`),
          (erro: Error) => void message.error(erro.message),
        ),
    })
  }

  return (
    <Secao
      titulo="Salas"
      semPreenchimento
      acoes={
        <Botao variante="primario" onClick={() => setEditando('nova')}>
          Nova sala
        </Botao>
      }
    >
      <EstadoDaConsulta consulta={salas} rotulo="Carregando as salas…">
        <Table<Sala>
          rowKey="id"
          dataSource={salas.data ?? []}
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: 'Nenhuma sala cadastrada.' }}
          columns={[
            { title: 'Sala', dataIndex: 'nome' },
            { title: 'Estantes', dataIndex: 'estantes' },
            {
              title: '',
              align: 'right',
              render: (_, sala) => (
                <Linha espaco={4} distribuicao="flex-end" estilo={{ flexWrap: 'nowrap' }}>
                  <Botao variante="fantasma" onClick={() => setEditando(sala)}>
                    Renomear
                  </Botao>
                  <Botao variante="fantasma" onClick={() => remover(sala)}>
                    Remover
                  </Botao>
                </Linha>
              ),
            },
          ]}
        />
      </EstadoDaConsulta>
      {editando && (
        <FormularioDaSala
          sala={editando === 'nova' ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      )}
    </Secao>
  )
}

function FormularioDaSala({ sala, aoFechar }: { sala: Sala | null; aoFechar: () => void }) {
  const { message } = App.useApp()
  const salvar = useSalvarSala()
  const [form] = Form.useForm<{ nome: string }>()

  function enviar(campos: { nome: string }) {
    const nome = campos.nome.trim()

    salvar.mutate(sala ? { tipo: 'renomear', id: sala.id, nome } : { tipo: 'criar', nome }, {
      onSuccess: () => {
        void message.success(sala ? `${sala.nome} renomeada para ${nome}.` : `${nome} cadastrada.`)
        aoFechar()
      },
      onError: (erro) => void message.error(motivoDaFalha(erro)),
    })
  }

  return (
    <Modal
      open
      title={sala ? `Renomear ${sala.nome}` : 'Nova sala'}
      okText="Salvar"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
    >
      <Form form={form} layout="vertical" onFinish={enviar} initialValues={{ nome: sala?.nome }}>
        <Form.Item
          name="nome"
          label="Nome"
          rules={[{ required: true, whitespace: true, message: 'Informe o nome da sala' }]}
        >
          <Input maxLength={60} placeholder="Sala 4" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function EstantesDasSalas() {
  const { message, modal } = App.useApp()
  const estantes = useEstantes()
  const salas = useSalas()
  const salvar = useSalvarEstante()
  const [editando, setEditando] = useState<Estante | 'nova' | null>(null)
  // O formulário tira a sala e o número sugeridos das duas listas quando abre: aberto antes de
  // elas chegarem (a API acordando leva segundos), viria sem sala e com E-01
  const listasCarregadas = salas.data !== undefined && estantes.data !== undefined

  function remover(estante: Estante) {
    void modal.confirm({
      title: `Remover a estante ${estante.numeroVisivel}?`,
      content: `Ela sai da grade da ${estante.sala}. Só dá para remover a estante vazia, sem caixa em nenhuma posição.`,
      okText: 'Remover',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () =>
        salvar.mutateAsync({ tipo: 'remover', id: estante.id }).then(
          () => void message.success(`Estante ${estante.numeroVisivel} removida.`),
          (erro: Error) => void message.error(erro.message),
        ),
    })
  }

  return (
    <Secao
      titulo="Estantes"
      semPreenchimento
      acoes={
        <Botao variante="primario" onClick={() => setEditando('nova')} disabled={!listasCarregadas}>
          Nova estante
        </Botao>
      }
    >
      <EstadoDaConsulta consulta={estantes} rotulo="Carregando as estantes…">
        <Table<Estante>
          rowKey="id"
          dataSource={estantes.data ?? []}
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: 'Nenhuma estante cadastrada.' }}
          columns={[
            { title: 'Número', dataIndex: 'numeroVisivel' },
            { title: 'Sala', dataIndex: 'sala' },
            { title: 'Modelo', render: (_, e) => `${e.fabricante} ${e.modelo}` },
            {
              title: 'Capacidade',
              render: (_, e) =>
                `${e.faces * e.linhas * e.colunas} caixas (${e.linhas} x ${e.colunas} por face)`,
            },
            {
              title: '',
              align: 'right',
              render: (_, estante) => (
                <Linha espaco={4} distribuicao="flex-end" estilo={{ flexWrap: 'nowrap' }}>
                  <Botao variante="fantasma" onClick={() => setEditando(estante)}>
                    Editar
                  </Botao>
                  <Botao variante="fantasma" onClick={() => remover(estante)}>
                    Remover
                  </Botao>
                </Linha>
              ),
            },
          ]}
        />
      </EstadoDaConsulta>
      {editando && (
        <FormularioDaEstante
          estante={editando === 'nova' ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      )}
    </Secao>
  )
}

interface CamposDaEstante {
  idSala: number
  /** o índice em MODELOS; só no cadastro */
  modelo: number
  numeroVisivel: string
}

function FormularioDaEstante({
  estante,
  aoFechar,
}: {
  estante: Estante | null
  aoFechar: () => void
}) {
  const { message } = App.useApp()
  const salas = useSalas()
  const estantes = useEstantes()
  const salvar = useSalvarEstante()
  const [form] = Form.useForm<CamposDaEstante>()

  function enviar(campos: CamposDaEstante) {
    const numeroVisivel = campos.numeroVisivel.trim()
    const aviso = (texto: string) => ({
      onSuccess: () => {
        void message.success(texto)
        aoFechar()
      },
      onError: (erro: Error) => void message.error(motivoDaFalha(erro)),
    })

    if (estante) {
      salvar.mutate(
        { tipo: 'alterar', id: estante.id, dados: { numeroVisivel, idSala: campos.idSala } },
        aviso(`Estante ${numeroVisivel} salva.`),
      )
      return
    }

    const modelo = MODELOS[campos.modelo]
    if (!modelo) return

    salvar.mutate(
      { tipo: 'criar', dados: { idSala: campos.idSala, numeroVisivel, faces: 2, ...modelo } },
      aviso(`Estante ${numeroVisivel} cadastrada.`),
    )
  }

  return (
    <Modal
      open
      title={estante ? `Editar estante · ${estante.numeroVisivel}` : 'Nova estante'}
      okText={estante ? 'Salvar' : 'Cadastrar estante'}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={enviar}
        initialValues={
          estante
            ? { idSala: estante.idSala, numeroVisivel: estante.numeroVisivel }
            : {
                idSala: salas.data?.[0]?.id,
                modelo: 0,
                numeroVisivel: proximoNumeroDeEstante(estantes.data ?? []),
              }
        }
      >
        <Form.Item
          name="idSala"
          label="Sala"
          rules={[{ required: true, message: 'Escolha a sala' }]}
        >
          <Select
            options={(salas.data ?? []).map((sala) => ({ value: sala.id, label: sala.nome }))}
            loading={salas.isPending}
            notFoundContent="Cadastre uma sala antes"
          />
        </Form.Item>
        {estante ? (
          <Form.Item
            label="Modelo"
            extra="O modelo não muda depois do cadastro. Para trocar, remova a estante e cadastre de novo."
          >
            <Input value={descricaoDoModelo(estante)} disabled />
          </Form.Item>
        ) : (
          <Form.Item name="modelo" label="Modelo" rules={[{ required: true }]}>
            <Select
              options={MODELOS.map((opcao, indice) => ({
                value: indice,
                label: descricaoDoModelo({ ...opcao, faces: 2 }),
              }))}
            />
          </Form.Item>
        )}
        <Form.Item
          name="numeroVisivel"
          label="Número da estante"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Informe o número, como está na etiqueta. ex: E-05',
            },
          ]}
        >
          <Input placeholder="E-05" maxLength={30} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
