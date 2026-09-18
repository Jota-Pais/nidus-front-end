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

/**
 * `RF-ACS-01` — autenticação pela identidade institucional.
 *
 * Usa a **mesma casca** da aplicação logada (`@/layout/AppLayout`), não uma
 * composição própria: o cabeçalho é literalmente o `casca__topo` — mesmas
 * classes, mesma marca, mesma faixa azul institucional — porque antes do
 * login era a única tela sem essa faixa, e por isso a única que não parecia
 * o mesmo sistema. Sem `Sider` (não há navegação antes de entrar), o
 * conteúdo usa `CabecalhoDaTela` + `Secao` como qualquer outra tela.
 *
 * A composição anterior (painel escuro de canto a canto, foto recortada em
 * diagonal) também contrariava a própria regra do design system: o
 * `SecaoInvertida` avisa para não pôr fundo escuro atrás de formulário, pelo
 * contraste que o `RNF-10` cobra.
 *
 * Três correções em relação ao rascunho original, todas de requisito:
 *
 * 1. **Um formulário, não três.** O original tinha um card de acesso por
 *    perfil, o usuário escolhendo se entra como gestor, técnico ou
 *    pesquisador. O `RF-ACS-02` não permite: o perfil vem do servidor junto
 *    da sessão (`POST /api/sessao` devolve `usuario.perfil`). Escolher o
 *    próprio perfil na tela é autorização decidida no cliente.
 * 2. **Mensagem de erro**, que o card do Trello pede e não existia. O `Aviso`
 *    já entra com `role="alert"`, para o leitor de tela anunciar (`RNF-10`).
 * 3. **Validação por Zod**, o padrão da equipe para formulário.
 *
 * ⚠️ **O acesso local não é gambiarra de semestre.** O `RF-ACS-01` exige
 * acesso administrativo independente do SSO, para não perder o sistema se o
 * ID-UFSC cair — e o ID-UFSC depende do SETIC (`PEN-09`).
 *
 * O formulário chama `POST /api/sessao` de verdade — é a única porta de
 * entrada. Sem API no ar, a mensagem de erro é a de rede
 * (`ErroDeRede`, `@/lib/api`), não uma tela alternativa.
 */
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
      // O perfil vem do servidor (RF-ACS-02), nunca da tela.
      onSuccess: (usuario) => navegar(destino(usuario.perfil), { replace: true }),
      // A mensagem já sai pronta de @/lib/erros: no 401 ela não distingue
      // e-mail inexistente de senha errada.
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
                O login pelo ID-UFSC depende do SETIC e entra como mock no semestre (`PEN-09`) —
                por enquanto, entre com e-mail e senha institucionais.
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
