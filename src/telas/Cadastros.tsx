import { App, Form, Input, InputNumber, Select, Switch, Table, Tabs } from 'antd'
import { useState } from 'react'
import {
  Botao,
  CabecalhoDaTela,
  CampoDeData,
  Etiqueta,
  Janela,
  Linha,
  ListaDeCartoes,
  Pilha,
  Secao,
} from '@/componentes'
import {
  useCatalogo,
  useProjetos,
  useSalas,
  useSalvarLinhagem,
  useSalvarProjeto,
  useSalvarSala,
  useUsuarios,
} from '@/dominio/consultas'
import type { DadosDoProjeto } from '@/dominio/consultas'
import { formatarProtocolo } from '@/dominio/protocolo'
import { NOME_DO_CRUZAMENTO } from '@/dominio/caixa'
import type { Catalogo, Cruzamento, Projeto, Sala, SituacaoDoProjeto } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { motivoDaFalha } from '@/layout/useFalhaDoFormulario'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { formatarData } from '@/lib/data'
import { CampoDoProtocolo } from './CampoDoProtocolo'
import './Cadastros.css'

const SITUACOES: { value: SituacaoDoProjeto; label: string }[] = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'suspenso', label: 'Suspenso' },
]

/**
 * Os projetos CEUA ficam ocultos por enquanto: o pedido vale pelo protocolo digitado e nada no
 * sistema lê o cadastro de projetos (nem vigência nem cota). A aba volta quando houver uso
 */
const MOSTRAR_PROJETOS = false

/**
 * Linhagens e salas: o que antes só entrava pela carga inicial. A estante tem um lugar só, a tela
 * das estantes
 */
export function Cadastros() {
  const abas = [
    { key: 'projetos', label: 'Projetos CEUA', children: <Projetos /> },
    { key: 'linhagens', label: 'Linhagens', children: <Linhagens /> },
    { key: 'salas', label: 'Salas', children: <Salas /> },
  ].filter((aba) => MOSTRAR_PROJETOS || aba.key !== 'projetos')

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Configurações"
        titulo="Cadastros"
        descricao="Linhagens e salas. Nada é apagado: linhagem fora de uso fica inativa, e sala removida sai das listas, mas fica no histórico."
      />
      <Tabs items={abas} />
    </Pilha>
  )
}

/** A situação do projeto na etiqueta: vigente em verde */
function SituacaoDoProjetoNaEtiqueta({ projeto: p }: { projeto: Projeto }) {
  return (
    <Etiqueta tom={p.vigente ? 'sucesso' : 'neutro'}>
      {SITUACOES.find((s) => s.value === p.situacao)?.label ?? p.situacao}
    </Etiqueta>
  )
}

const vigencia = (p: Projeto) =>
  `${formatarData(p.dtVigenciaInicio)} a ${formatarData(p.dtVigenciaFim)}`

function Projetos() {
  const projetos = useProjetos()
  const estreita = useTelaEstreita()
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
        {estreita ? (
          <ListaDeCartoes
            itens={projetos.data ?? []}
            chave={(p) => p.id}
            rotulo="Projetos CEUA"
            vazio="Nenhum projeto cadastrado."
            renderizar={(p) => (
              <>
                <ListaDeCartoes.Topo lado={<SituacaoDoProjetoNaEtiqueta projeto={p} />}>
                  {p.titulo}
                  <span className="cadastros__codigo">{p.numero}</span>
                </ListaDeCartoes.Topo>
                <ListaDeCartoes.Dados>
                  <ListaDeCartoes.Dado rotulo="Responsável" largo>
                    {p.responsavel}
                  </ListaDeCartoes.Dado>
                  <ListaDeCartoes.Dado rotulo="Vigência">{vigencia(p)}</ListaDeCartoes.Dado>
                  <ListaDeCartoes.Dado rotulo="Cota">{p.cotaAutorizada}</ListaDeCartoes.Dado>
                </ListaDeCartoes.Dados>
                <ListaDeCartoes.Acoes>
                  <Botao onClick={() => setEditando(p)}>Editar</Botao>
                </ListaDeCartoes.Acoes>
              </>
            )}
          />
        ) : (
          <Table<Projeto>
            rowKey="id"
            dataSource={projetos.data ?? []}
            pagination={false}
            scroll={{ x: true }}
            locale={{ emptyText: 'Nenhum projeto cadastrado.' }}
            columns={[
              { title: 'Protocolo CEUA', dataIndex: 'numero' },
              { title: 'Título', dataIndex: 'titulo' },
              { title: 'Responsável', dataIndex: 'responsavel' },
              { title: 'Vigência', render: (_, p) => vigencia(p) },
              { title: 'Cota', dataIndex: 'cotaAutorizada' },
              { title: 'Situação', render: (_, p) => <SituacaoDoProjetoNaEtiqueta projeto={p} /> },
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
        )}
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
    <Janela
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
        <CampoDoProtocolo name="numero" rotulo="Protocolo CEUA" />
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
            <CampoDeData />
          </Form.Item>
          <Form.Item
            name="dtVigenciaFim"
            label="Fim da vigência"
            rules={[{ required: true, message: 'Data' }]}
          >
            <CampoDeData />
          </Form.Item>
          <Form.Item
            name="cotaAutorizada"
            label="Cota autorizada"
            rules={[{ required: true, message: 'Informe a cota autorizada.' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="situacao" label="Situação" rules={[{ required: true }]}>
            <Select options={SITUACOES} style={{ width: 130 }} />
          </Form.Item>
        </Linha>
      </Form>
    </Janela>
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

/**
 * A regra das famílias A-E de cada linhagem: só faz aparecer o aviso no casal fora dela, nunca
 * impede. Sem regra, o casal não avisa nada
 */
const OPCOES_DE_CRUZAMENTO: { value: Cruzamento | 'sem'; label: string }[] = [
  { value: 'rodizio', label: NOME_DO_CRUZAMENTO.rodizio },
  { value: 'mesma_letra', label: NOME_DO_CRUZAMENTO.mesma_letra },
  { value: 'sem', label: 'Sem regra' },
]

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
            aria-label={`Nova linhagem de ${especie.nome}`}
            value={nome}
            maxLength={60}
            onChange={(evento) => setNome(evento.target.value)}
            onPressEnter={adicionar}
            className="cadastros__novaLinhagem"
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
            title: 'Cruzamento',
            width: 240,
            render: (_, linhagem) => (
              <Select<Cruzamento | 'sem'>
                value={linhagem.cruzamento ?? 'sem'}
                options={OPCOES_DE_CRUZAMENTO}
                aria-label={`Cruzamento da ${linhagem.nome}`}
                style={{ width: '100%' }}
                onChange={(valor) => {
                  const cruzamento = valor === 'sem' ? null : valor
                  salvar.mutate(
                    { tipo: 'alterar', id: linhagem.id, dados: { cruzamento } },
                    aviso(
                      `${linhagem.nome}: ${cruzamento === null ? 'sem regra de cruzamento' : NOME_DO_CRUZAMENTO[cruzamento].toLowerCase()}.`,
                    ),
                  )
                }}
              />
            ),
          },
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

/**
 * Sala pode existir sem estante, e a estante nasce numa sala, pela tela das estantes. Remover só
 * tira da lista, e o back só aceita a sala sem estante
 */
function Salas() {
  const { message, modal } = App.useApp()
  const estreita = useTelaEstreita()
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
        {estreita ? (
          <ListaDeCartoes
            itens={salas.data ?? []}
            chave={(sala) => sala.id}
            rotulo="Salas"
            vazio="Nenhuma sala cadastrada."
            renderizar={(sala) => (
              <>
                <ListaDeCartoes.Topo
                  lado={
                    <span className="cadastros__lado">
                      {sala.estantes} {sala.estantes === 1 ? 'estante' : 'estantes'}
                    </span>
                  }
                >
                  {sala.nome}
                </ListaDeCartoes.Topo>
                <ListaDeCartoes.Acoes>
                  <Botao onClick={() => setEditando(sala)}>Renomear</Botao>
                  <Botao onClick={() => remover(sala)}>Remover</Botao>
                </ListaDeCartoes.Acoes>
              </>
            )}
          />
        ) : (
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
        )}
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
    <Janela
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
    </Janela>
  )
}
