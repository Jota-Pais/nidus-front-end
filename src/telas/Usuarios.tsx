import { App, Form, Input, Modal, Select, Switch, Table } from 'antd'
import { useState } from 'react'
import { usePerfil } from '@/auth/contexto'
import { Botao, CabecalhoDaTela, Etiqueta, Pilha, Secao } from '@/componentes'
import {
  useCriarConta,
  useEnviarRedefinicaoDeSenha,
  useSalvarUsuario,
  useUsuarios,
} from '@/dominio/consultas'
import type { ContaNova } from '@/dominio/consultas'
import type { Perfil, Usuario } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'

const PERFIS: { value: Perfil; label: string }[] = [
  { value: 'pesquisador', label: 'Pesquisador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'gestor', label: 'Gestor' },
]

/**
 * As contas do sistema: o gestor cria, troca o perfil, desativa e manda à pessoa o código para
 * ela redefinir a senha. Definir a senha de alguém, ele não pode
 */
export function Usuarios() {
  const { message, modal } = App.useApp()
  const { usuario: eu } = usePerfil()
  const usuarios = useUsuarios()
  const salvar = useSalvarUsuario()
  const redefinir = useEnviarRedefinicaoDeSenha()
  const [criando, setCriando] = useState(false)

  function alterar(conta: Usuario, dados: { perfil?: Perfil; ativo?: boolean }, aviso: string) {
    salvar.mutate(
      { tipo: 'alterar', id: conta.id, dados },
      {
        onSuccess: () => void message.success(aviso),
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  function confirmar(
    conta: Usuario,
    dados: { perfil?: Perfil; ativo?: boolean },
    titulo: string,
    aviso: string,
  ) {
    void modal.confirm({
      title: titulo,
      content: `As sessões abertas de ${conta.nome} serão encerradas, e a pessoa precisará entrar de novo.`,
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: () => alterar(conta, dados, aviso),
    })
  }

  function enviarRedefinicao(conta: Usuario) {
    void modal.confirm({
      title: `Enviar redefinição de senha para ${conta.nome}?`,
      content: `A pessoa recebe em ${conta.email} um código para definir a senha. A senha atual continua valendo até lá.`,
      okText: 'Enviar',
      cancelText: 'Cancelar',
      onOk: () =>
        redefinir.mutateAsync(conta.id).then(
          () =>
            void message.success(`Enviamos para ${conta.email} um código para definir a senha.`),
          (erro: Error) => void message.error(erro.message),
        ),
    })
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
                      confirmar(
                        conta,
                        { perfil },
                        `Mudar o perfil de ${conta.nome}?`,
                        `Perfil de ${conta.nome} alterado.`,
                      )
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
                      ativo
                        ? alterar(conta, { ativo }, `${conta.nome} reativada.`)
                        : confirmar(
                            conta,
                            { ativo },
                            `Desativar a conta de ${conta.nome}?`,
                            `${conta.nome} desativada.`,
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
                  <Botao
                    variante="fantasma"
                    disabled={!conta.ativo}
                    onClick={() => enviarRedefinicao(conta)}
                  >
                    Enviar redefinição de senha
                  </Botao>
                ),
              },
            ]}
          />
        </EstadoDaConsulta>
      </Secao>

      {criando && <NovaConta aoFechar={() => setCriando(false)} />}
    </Pilha>
  )
}

function NovaConta({ aoFechar }: { aoFechar: () => void }) {
  const { message } = App.useApp()
  const criar = useCriarConta()
  const [form] = Form.useForm<ContaNova>()

  function enviar(conta: ContaNova) {
    criar.mutate(conta, {
      onSuccess: ({ codigoEnviado }) => {
        void message.success(
          codigoEnviado
            ? `Conta de ${conta.nome} criada. Enviamos para ${conta.email} um código para definir a senha.`
            : `Conta de ${conta.nome} criada, mas o código não foi enviado. Use "Enviar redefinição de senha" na lista.`,
        )
        aoFechar()
      },
      onError: (erro) => void message.error(erro.message),
    })
  }

  return (
    <Modal
      open
      title="Nova conta"
      okText="Criar conta"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={criar.isPending}
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
      </Form>
    </Modal>
  )
}
