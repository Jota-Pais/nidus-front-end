import { ExperimentOutlined, InfoCircleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Aviso,
  Botao,
  Cartao,
  Colunas,
  Entrada,
  Formulario,
  Linha,
  Paragrafo,
  Pilha,
  Texto,
  Titulo,
} from '@/componentes'
import { usePerfil } from '@/auth/contexto'
import { useLogin } from '@/auth/sessao'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'
import { destinoAposLogin } from '@/layout/destino'
import { validadorDeCampo } from './login.schema'
import type { Credenciais } from './login.schema'
import './Login.css'

/**
 * `RF-ACS-01` — autenticação pela identidade institucional.
 *
 * Composição visual de Gabriel Ugione (commit `dbfb26f`), preservada: o
 * recorte da foto, a divisão do painel e a barra branca do rodapé são dele.
 * A paleta passou a sair dos tokens com a chegada do design system, e o
 * conteúdo passou a usar os componentes do projeto — o desenho é o mesmo.
 *
 * Três correções em relação ao original, todas de requisito:
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
 * O formulário chama `POST /api/sessao` de verdade. Enquanto o back-end não
 * sobe, ele responde com erro de rede e o acesso de desenvolvimento ao lado é
 * que navega — os dois caminhos convivem sem `if` de ambiente.
 */
export function Login() {
  const { perfil, entrarComoDesenvolvimento } = usePerfil()
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

  function entrarSemApi(escolhido: Perfil) {
    entrarComoDesenvolvimento(escolhido)
    navegar(destino(escolhido), { replace: true })
  }

  return (
    // `padraoDePontos` e `brilhoDeAcento` são os efeitos de textura do design
    // system, definidos em `@/app/tokens.css`: é o que impede o painel escuro
    // de ficar chapado. Decorativos — nada de conteúdo depende deles.
    <div className="loginContainer padraoDePontos brilhoDeAcento">
      <div className="leftPanel">
        <div className="mainContent">
          <header className="headerSection">
            <Linha espaco={12}>
              <ExperimentOutlined className="headerIcon" aria-hidden="true" />
              <Titulo nivel={1}>Nidus</Titulo>
            </Linha>
            <Texto className="headerSubtitle">Sistema de Gestão de Biotério — CPMR / UFSC</Texto>
          </header>

          <Colunas minimo={300} espaco={20}>
            <Cartao className="loginCard">
              <Pilha espaco={16}>
                <Titulo nivel={4}>Acesso ao sistema</Titulo>

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
            </Cartao>

            <div className="infoBox">
              <div>
                <Linha espaco={8}>
                  <InfoCircleOutlined className="infoIcon" aria-hidden="true" />
                  <Texto tom="forte" className="infoTitle">
                    Biotério Central UFSC
                  </Texto>
                </Linha>
                <Paragrafo>
                  <span className="infoText">
                    Unidade dedicada à criação, controle e suporte na manutenção de roedores para
                    atividades de pesquisa e ensino da universidade.
                  </span>
                </Paragrafo>
              </div>

              <div className="devBox">
                <Texto className="devTitle" id="rotulo-acesso-dev">
                  Acesso de desenvolvimento — o login pelo ID-UFSC depende do SETIC e entra como
                  mock no semestre.
                </Texto>
                <div role="group" aria-labelledby="rotulo-acesso-dev">
                  <Linha espaco={8}>
                    {(Object.keys(PERFIS) as Perfil[]).map((chave) => (
                      <Botao key={chave} size="small" onClick={() => entrarSemApi(chave)}>
                        {PERFIS[chave].rotulo}
                      </Botao>
                    ))}
                  </Linha>
                </div>
              </div>
            </div>
          </Colunas>
        </div>

        <footer className="bottomWhiteBar">
          <div className="bottomBarContent">
            <Titulo nivel={3}>Centro de Pesquisas Biológicas</Titulo>
            <Paragrafo secundario>
              Plataforma restrita para controle de matrizes, linhagens e alocação de roedores. Para
              dúvidas operacionais ou cadastro de pesquisadores, entre em contato com a administração
              do CPMR / UFSC.
            </Paragrafo>
          </div>
        </footer>
      </div>

      {/* Decorativa: o conteúdo não depende dela, então fica fora da leitura. */}
      <div className="sideImage" role="presentation" />
    </div>
  )
}
