import { App, Form, Input, Modal, Select, Switch, Table } from 'antd'
import { useState } from 'react'
import { usePerfil } from '@/auth/contexto'
import { Botao, CabecalhoDaTela, Etiqueta, Pilha, Secao } from '@/componentes'
import { useSalvarUsuario, useUsuarios } from '@/dominio/consultas'
import type { ContaNova } from '@/dominio/consultas'
import type { Perfil, Usuario } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'

const PERFIS: { value: Perfil; label: string }[] = [
  { value: 'pesquisador', label: 'Pesquisador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'gestor', label: 'Gestor' },
]

const SENHA = [
  { required: true, message: 'Informe a senha' },
  { min: 8, message: 'A senha precisa de pelo menos 8 caracteres' },
]

/** As contas do sistema: o gestor cria, troca o perfil, desativa e redefine a senha */
export function Usuarios() {
  const { message } = App.useApp()
  const { usuario: eu } = usePerfil()
  const usuarios = useUsuarios()
  const salvar = useSalvarUsuario()
  const [criando, setCriando] = useState(false)
  const [trocandoSenha, setTrocandoSenha] = useState<Usuario | null>(null)

  function alterar(conta: Usuario, dados: { perfil?: Perfil; ativo?: boolean }, aviso: string) {
    salvar.mutate(
      { tipo: 'alterar', id: conta.id, dados },
      {
        onSuccess: () => void message.success(aviso),
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Gestão"
        titulo="Usuários"
        descricao="Quem entra no sistema e com qual perfil. Mudar o perfil ou desativar encerra as sessões abertas da pessoa."
        acoes={
          <Botao variante="primario" onClick={() => setCriando(true)}>
            Nova conta
          </Botao>
        }
      />

      <Secao semPreenchimento>
        <EstadoDaConsulta consulta={usuarios} rotulo="Carregando as contas…">
          <Table<Usuario>
            rowKey="id"
            dataSource={usuarios.data ?? []}
            pagination={false}
            scroll={{ x: true }}
            columns={[
              { title: 'Nome', dataIndex: 'nome' },
              { title: 'E-mail', dataIndex: 'email' },
              {
                title: 'Perfil',
                width: 170,
                render: (_, conta) => (
                  <Select<Perfil>
                    value={conta.perfil}
                    options={PERFIS}
                    disabled={conta.id === eu?.id}
                    style={{ width: 150 }}
                    onChange={(perfil) =>
                      alterar(conta, { perfil }, `Perfil de ${conta.nome} alterado.`)
                    }
                  />
                ),
              },
              {
                title: 'Ativa',
                width: 80,
                render: (_, conta) => (
                  <Switch
                    checked={conta.ativo}
                    disabled={conta.id === eu?.id}
                    onChange={(ativo) =>
                      alterar(
                        conta,
                        { ativo },
                        `${conta.nome} ${ativo ? 'reativada' : 'desativada'}.`,
                      )
                    }
                  />
                ),
              },
              {
                title: 'Senha',
                render: (_, conta) =>
                  conta.temSenha ? (
                    <Etiqueta tom="sucesso">Definida</Etiqueta>
                  ) : (
                    <Etiqueta>Sem senha</Etiqueta>
                  ),
              },
              {
                title: '',
                render: (_, conta) => (
                  <Botao variante="fantasma" onClick={() => setTrocandoSenha(conta)}>
                    Definir senha
                  </Botao>
                ),
              },
            ]}
          />
        </EstadoDaConsulta>
      </Secao>

      {criando && <NovaConta aoFechar={() => setCriando(false)} />}
      {trocandoSenha && (
        <DefinirSenhaDaConta conta={trocandoSenha} aoFechar={() => setTrocandoSenha(null)} />
      )}
    </Pilha>
  )
}

function NovaConta({ aoFechar }: { aoFechar: () => void }) {
  const { message } = App.useApp()
  const salvar = useSalvarUsuario()
  const [form] = Form.useForm<ContaNova>()

  function enviar(conta: ContaNova) {
    salvar.mutate(
      { tipo: 'criar', conta },
      {
        onSuccess: () => {
          void message.success(
            `Conta de ${conta.nome} criada. Passe a senha para a pessoa por um canal seguro.`,
          )
          aoFechar()
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Modal
      open
      title="Nova conta"
      okText="Criar conta"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={enviar}
        initialValues={{ perfil: 'pesquisador' }}
      >
        <Form.Item
          name="nome"
          label="Nome"
          rules={[{ required: true, whitespace: true, message: 'Informe o nome' }]}
        >
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item
          name="email"
          label="E-mail"
          rules={[{ required: true, type: 'email', message: 'E-mail inválido' }]}
        >
          <Input maxLength={160} />
        </Form.Item>
        <Form.Item name="perfil" label="Perfil" rules={[{ required: true }]}>
          <Select options={PERFIS} />
        </Form.Item>
        <Form.Item name="senha" label="Senha inicial" rules={SENHA}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function DefinirSenhaDaConta({ conta, aoFechar }: { conta: Usuario; aoFechar: () => void }) {
  const { message } = App.useApp()
  const salvar = useSalvarUsuario()
  const [form] = Form.useForm<{ senha: string }>()

  return (
    <Modal
      open
      title={`Definir senha · ${conta.nome}`}
      okText="Salvar senha"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={({ senha }) =>
          salvar.mutate(
            { tipo: 'senha', id: conta.id, senha },
            {
              onSuccess: () => {
                void message.success(`Senha de ${conta.nome} definida.`)
                aoFechar()
              },
              onError: (erro) => void message.error(erro.message),
            },
          )
        }
      >
        <Form.Item name="senha" label="Nova senha" rules={SENHA}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
