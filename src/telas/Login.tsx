import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Aviso,
  Botao,
  CabecalhoDaTela,
  Entrada,
  Etiqueta,
  Formulario,
  Linha,
  Pilha,
  Texto,
} from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import { usePerfil } from '@/auth/contexto'
import { useLogin } from '@/auth/sessao'
import type { Perfil } from '@/dominio/tipos'
import '@/layout/appLayout.css'
import { destinoAposLogin } from '@/layout/destino'
import { validadorDeCampo } from './login.schema'
import type { Credenciais } from './login.schema'
import './Login.css'

export function Login() {
  const { perfil } = usePerfil()
  const navegar = useNavigate()
  const { state } = useLocation()
  const login = useLogin()
  const [erro, setErro] = useState<string | null>(null)

  const destino = (perfilDoUsuario: Perfil) => destinoAposLogin(state, perfilDoUsuario)

  if (perfil) return <Navigate to={destino(perfil)} replace />

  function aoEnviar(valores: Credenciais) {
    setErro(null)
    login.mutate(valores, {
      // O perfil vem do servidor, nunca da tela
      onSuccess: (usuario) => navegar(destino(usuario.perfil), { replace: true }),
      // A mensagem já sai pronta de @/lib/erros: no 401 ela não distingue e-mail
      // inexistente de senha errada
      onError: (falha) => setErro(falha.message),
    })
  }

  return (
    <main className="loginPagina">
      <div className="loginPagina__imagem" role="presentation" />

      <div className="loginPagina__painel">
        <div className="loginPagina__miolo">
          <Pilha espaco={24}>
            {/* A mesma marca da faixa do `AppLayout`: deixa visível que é o
                mesmo sistema antes de entrar. */}
            <Linha espaco={12}>
              <span className="casca__marca" aria-hidden="true" />
              <span className="loginPagina__nome">Nidus</span>
              <Texto tom="secundario">CPMR/UFSC</Texto>
              {mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>}
            </Linha>

            <CabecalhoDaTela titulo="Bem-vindo!" descricao="Acesse sua conta" />

            {erro && <Aviso tom="erro" titulo={erro} />}

            <Formulario<Credenciais> onFinish={aoEnviar} disabled={login.isPending}>
              <Formulario.Campo
                name="email"
                rotulo="E-mail institucional"
                rules={[{ validator: validadorDeCampo('email') }]}
              >
                <Entrada
                  prefix={<UserOutlined aria-hidden="true" />}
                  placeholder="nome@ufsc.br"
                  autoComplete="username"
                  inputMode="email"
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
          </Pilha>
        </div>
      </div>
    </main>
  )
}
