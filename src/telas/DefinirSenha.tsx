import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Form } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Aviso, Botao, CabecalhoDaTela, Entrada, Formulario, Linha } from '@/componentes'
import { useDefinirSenha, usePedirCodigo, useVerificarCodigo } from '@/auth/acesso'
import { usePerfil } from '@/auth/contexto'
import type { Usuario } from '@/auth/sessao'
import type { Perfil } from '@/dominio/tipos'
import { destinoAposLogin } from '@/layout/destino'
import { TelaDeEntrada } from '@/layout/TelaDeEntrada'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ErroDeApi } from '@/lib/api'
import { TAMANHO_MINIMO_DA_SENHA, acesso, validadorDeAcesso } from './acesso.schema'
import './DefinirSenha.css'

/** Em que etapa a pessoa está. Cada etapa carrega o que a anterior confirmou */
type Etapa =
  | { qual: 'email'; email?: string }
  | { qual: 'codigo'; email: string; validadeEmMinutos: number; aviso?: string }
  | { qual: 'senha'; email: string; validadeEmMinutos: number; codigo: string; novo: boolean }

/**
 * Primeiro acesso e senha esquecida. O código que chega no e-mail prova que a
 * pessoa tem o e-mail; quem é novo informa o nome, e todos saem com senha e sessão aberta
 */
export function DefinirSenha() {
  const { perfil } = usePerfil()
  const navegar = useNavigate()
  // O destino que o login recebeu da rota protegida, para quem veio de um link
  const { state } = useLocation()
  const [etapa, setEtapa] = useState<Etapa>({ qual: 'email' })

  const destino = (perfilDoUsuario: Perfil) => destinoAposLogin(state, perfilDoUsuario)

  if (perfil) return <Navigate to={destino(perfil)} replace />

  return (
    <TelaDeEntrada>
      {etapa.qual === 'email' && (
        <EtapaDoEmail
          {...(etapa.email === undefined ? {} : { emailAnterior: etapa.email })}
          aoEnviar={(email, validadeEmMinutos) =>
            setEtapa({ qual: 'codigo', email, validadeEmMinutos })
          }
        />
      )}

      {etapa.qual === 'codigo' && (
        <EtapaDoCodigo
          email={etapa.email}
          validadeEmMinutos={etapa.validadeEmMinutos}
          {...(etapa.aviso === undefined ? {} : { aviso: etapa.aviso })}
          aoConferir={(codigo, novo) =>
            setEtapa({
              qual: 'senha',
              email: etapa.email,
              validadeEmMinutos: etapa.validadeEmMinutos,
              codigo,
              novo,
            })
          }
          // Quem troca quase sempre quer corrigir um erro de digitação: o e-mail volta junto
          aoTrocarEmail={() => setEtapa({ qual: 'email', email: etapa.email })}
        />
      )}

      {etapa.qual === 'senha' && (
        <EtapaDaSenha
          email={etapa.email}
          codigo={etapa.codigo}
          novo={etapa.novo}
          // O perfil vem do servidor, nunca da tela
          aoEntrar={(usuario) => navegar(destino(usuario.perfil), { replace: true })}
          aoVencerCodigo={(aviso) =>
            setEtapa({
              qual: 'codigo',
              email: etapa.email,
              validadeEmMinutos: etapa.validadeEmMinutos,
              aviso,
            })
          }
        />
      )}

      <Link to="/login" state={state} className="telaDeEntrada__link">
        Voltar para o login
      </Link>
    </TelaDeEntrada>
  )
}

function EtapaDoEmail({
  emailAnterior,
  aoEnviar,
}: {
  emailAnterior?: string
  aoEnviar: (email: string, validadeEmMinutos: number) => void
}) {
  const [form] = Form.useForm<{ email: string }>()
  const pedir = usePedirCodigo()
  const falha = useFalhaDoFormulario(form, ['email'])

  function enviar(valores: { email: string }) {
    const email = acesso.shape.email.parse(valores.email)
    falha.limpar()
    pedir.mutate(email, {
      onSuccess: ({ validadeEmMinutos }) => aoEnviar(email, validadeEmMinutos),
      onError: falha.mostrar,
    })
  }

  return (
    <>
      <CabecalhoDaTela
        titulo="Definir senha"
        descricao="Vamos enviar um código para o seu e-mail."
      />

      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}

      <Formulario<{ email: string }>
        form={form}
        onFinish={enviar}
        disabled={pedir.isPending}
        initialValues={{ email: emailAnterior ?? '' }}
      >
        <Formulario.Campo
          name="email"
          rotulo="E-mail"
          rules={[{ validator: validadorDeAcesso('email') }]}
        >
          <Entrada
            prefix={<UserOutlined aria-hidden="true" />}
            placeholder="nome@exemplo.com"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
          />
        </Formulario.Campo>

        <Botao variante="primario" htmlType="submit" block loading={pedir.isPending}>
          Enviar código
        </Botao>
      </Formulario>
    </>
  )
}

function EtapaDoCodigo({
  email,
  validadeEmMinutos,
  aviso,
  aoConferir,
  aoTrocarEmail,
}: {
  email: string
  validadeEmMinutos: number
  /** Por que a pessoa voltou para cá, quando o código venceu na etapa da senha */
  aviso?: string
  aoConferir: (codigo: string, novo: boolean) => void
  aoTrocarEmail: () => void
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ codigo: string }>()
  const verificar = useVerificarCodigo()
  const reenviar = usePedirCodigo()
  const falha = useFalhaDoFormulario(form, ['codigo'], aviso)
  const ocupado = verificar.isPending || reenviar.isPending

  function conferir(valores: { codigo: string }) {
    const codigo = acesso.shape.codigo.parse(valores.codigo)
    falha.limpar()
    verificar.mutate(
      { email, codigo },
      {
        onSuccess: ({ novo }) => aoConferir(codigo, novo),
        onError: falha.mostrar,
      },
    )
  }

  function pedirOutro() {
    falha.limpar()
    reenviar.mutate(email, {
      onSuccess: () => {
        form.resetFields()
        void message.success('Enviamos um código novo.')
      },
      onError: falha.mostrar,
    })
  }

  return (
    <>
      <CabecalhoDaTela
        titulo="Confira o seu e-mail"
        descricao={`Enviamos um código de 6 números para ${email}. Ele vale por ${validadeEmMinutos} minutos.`}
      />

      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}

      <Formulario<{ codigo: string }> form={form} onFinish={conferir} disabled={ocupado}>
        <Formulario.Campo
          name="codigo"
          rotulo="Código"
          rules={[{ validator: validadorDeAcesso('codigo') }]}
        >
          <Entrada
            className="definirSenha__codigo"
            placeholder="000000"
            autoComplete="one-time-code"
            inputMode="numeric"
            autoFocus
          />
        </Formulario.Campo>

        <Botao variante="primario" htmlType="submit" block loading={verificar.isPending}>
          Continuar
        </Botao>
      </Formulario>

      <Linha distribuicao="space-between">
        <Botao
          variante="fantasma"
          onClick={pedirOutro}
          loading={reenviar.isPending}
          disabled={ocupado}
        >
          Reenviar código
        </Botao>
        <Botao variante="fantasma" onClick={aoTrocarEmail} disabled={ocupado}>
          Trocar e-mail
        </Botao>
      </Linha>
    </>
  )
}

function EtapaDaSenha({
  email,
  codigo,
  novo,
  aoEntrar,
  aoVencerCodigo,
}: {
  email: string
  codigo: string
  /** Sem conta para o e-mail: pede o nome e cria a conta */
  novo: boolean
  aoEntrar: (usuario: Usuario) => void
  aoVencerCodigo: (aviso: string) => void
}) {
  const [form] = Form.useForm<{ nome: string; senha: string }>()
  const definir = useDefinirSenha()
  const falha = useFalhaDoFormulario(form, novo ? ['nome', 'senha'] : ['senha'])

  function salvar(valores: { nome: string; senha: string }) {
    falha.limpar()
    definir.mutate(
      {
        email,
        codigo,
        senha: acesso.shape.senha.parse(valores.senha),
        ...(novo ? { nome: acesso.shape.nome.parse(valores.nome) } : {}),
      },
      {
        onSuccess: aoEntrar,
        // O código venceu ou esgotou as tentativas enquanto a pessoa digitava: aqui não há
        // como pedir outro, então volta para a etapa do código, que tem o "Reenviar"
        onError: (erro) =>
          erro instanceof ErroDeApi && erro.codigo === 'CODIGO_INVALIDO'
            ? aoVencerCodigo(erro.message)
            : falha.mostrar(erro),
      },
    )
  }

  return (
    <>
      <CabecalhoDaTela titulo={novo ? 'Criar conta' : 'Nova senha'} descricao={email} />

      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}

      <Formulario<{ nome: string; senha: string }>
        form={form}
        onFinish={salvar}
        disabled={definir.isPending}
      >
        {/* Escondido: é o que faz o gerenciador de senhas guardar a senha nova junto do
            e-mail certo */}
        <input type="email" value={email} autoComplete="username" readOnly hidden />

        {novo && (
          <Formulario.Campo
            name="nome"
            rotulo="Nome completo"
            rules={[{ validator: validadorDeAcesso('nome') }]}
          >
            <Entrada autoComplete="name" autoFocus />
          </Formulario.Campo>
        )}

        <Formulario.Campo
          name="senha"
          rotulo="Senha"
          rules={[{ validator: validadorDeAcesso('senha') }]}
        >
          <Entrada.Senha
            prefix={<LockOutlined aria-hidden="true" />}
            placeholder={`Pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`}
            autoComplete="new-password"
            autoFocus={!novo}
          />
        </Formulario.Campo>

        <Botao variante="primario" htmlType="submit" block loading={definir.isPending}>
          {novo ? 'Criar conta e entrar' : 'Salvar senha e entrar'}
        </Botao>
      </Formulario>
    </>
  )
}
