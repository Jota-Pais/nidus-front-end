import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Form } from 'antd'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Aviso, Botao, CabecalhoDaTela, Entrada, Formulario } from '@/componentes'
import { usePerfil } from '@/auth/contexto'
import { useLogin } from '@/auth/sessao'
import type { Perfil } from '@/dominio/tipos'
import { destinoAposLogin } from '@/layout/destino'
import { TelaDeEntrada } from '@/layout/TelaDeEntrada'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { credenciais, validadorDeCampo } from './login.schema'
import type { Credenciais } from './login.schema'

export function Login() {
  const { perfil } = usePerfil()
  const navegar = useNavigate()
  const { state } = useLocation()
  const login = useLogin()
  const [form] = Form.useForm<Credenciais>()
  // Credencial errada não aponta campo: o foco volta para a senha, que é o que se redigita
  const falha = useFalhaDoFormulario(form, ['senha', 'email'])

  const destino = (perfilDoUsuario: Perfil) => destinoAposLogin(state, perfilDoUsuario)

  if (perfil) return <Navigate to={destino(perfil)} replace />

  function aoEnviar(valores: Credenciais) {
    falha.limpar()
    // O validador do formulário só confere: é o parse que tira o espaço e põe em minúsculas
    login.mutate(credenciais.parse(valores), {
      // O perfil vem do servidor, nunca da tela
      onSuccess: (usuario) => navegar(destino(usuario.perfil), { replace: true }),
      // A mensagem já sai pronta de useLogin: no 401 ela não distingue e-mail
      // inexistente de senha errada
      onError: falha.mostrar,
    })
  }

  return (
    <TelaDeEntrada>
      <CabecalhoDaTela titulo="Bem-vindo!" descricao="Acesse sua conta" />

      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}

      <Formulario<Credenciais> form={form} onFinish={aoEnviar} disabled={login.isPending}>
        <Formulario.Campo
          name="email"
          rotulo="E-mail"
          rules={[{ validator: validadorDeCampo('email') }]}
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

        <Formulario.Campo
          name="senha"
          rotulo="Senha"
          rules={[{ validator: validadorDeCampo('senha') }]}
        >
          <Entrada.Senha
            prefix={<LockOutlined aria-hidden="true" />}
            placeholder="Senha"
            autoComplete="current-password"
          />
        </Formulario.Campo>

        <Botao variante="primario" htmlType="submit" block loading={login.isPending}>
          Entrar
        </Botao>
      </Formulario>

      {/* Leva o destino junto: quem veio de um link para /estoque volta para lá depois */}
      <Link to="/definir-senha" state={state} className="telaDeEntrada__link">
        Primeiro acesso ou esqueceu a senha?
      </Link>
    </TelaDeEntrada>
  )
}
