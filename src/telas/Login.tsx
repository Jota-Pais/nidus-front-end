import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Layout } from 'antd'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Aviso,
  Botao,
  CabecalhoDaTela,
  Cartao,
  Entrada,
  Etiqueta,
  Formulario,
  Linha,
  Paragrafo,
  Pilha,
  Secao,
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

const { Header, Content } = Layout

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
    <Layout className="casca">
      {/* Idêntico ao cabeçalho do `AppLayout`: mesma marca, mesma faixa —
          é o que deixa visível que é o mesmo sistema antes de entrar. */}
      <Header className="casca__topo">
        <Linha espaco={12}>
          <span className="casca__marca" aria-hidden="true" />
          <span className="casca__nome">Nidus</span>
          <Texto tom="secundario" className="casca__instituicao">
            CPMR/UFSC
          </Texto>
          {mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>}
        </Linha>
      </Header>

      <Content className="casca__conteudo loginPagina__conteudo">
        <div className="loginPagina__miolo">
          <CabecalhoDaTela
            rotulo="Acesso"
            titulo="Entrar no sistema"
            descricao="Use sua identidade institucional para controlar matrizes, linhagens e alocação de roedores."
          />

          <div className="loginPagina__grade">
            <Pilha espaco={20}>
              <Secao titulo="Acesso ao sistema">
                <Pilha espaco={16}>
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
              </Secao>

              <Aviso tom="informacao" titulo="Login pelo ID-UFSC">
                O login pelo ID-UFSC depende do SETIC. Por enquanto, entre com e-mail e senha
                institucionais.
              </Aviso>

              <Paragrafo secundario>
                Plataforma restrita para controle de matrizes, linhagens e alocação de roedores.
                Para dúvidas operacionais ou cadastro de pesquisadores, entre em contato com a
                administração do CPMR / UFSC.
              </Paragrafo>
            </Pilha>

            <Cartao className="loginPagina__cartaoImagem">
              <div className="loginPagina__imagem" role="presentation" />
              <div className="loginPagina__imagemLegenda">
                <Texto tom="forte">Biotério Central UFSC</Texto>
                <Paragrafo secundario>
                  Unidade dedicada à criação, controle e suporte na manutenção de roedores para
                  atividades de pesquisa e ensino da universidade.
                </Paragrafo>
              </div>
            </Cartao>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
