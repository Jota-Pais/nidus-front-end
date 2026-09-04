import {
  ExperimentOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Row, Space, Typography } from 'antd'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { usePerfil } from '@/auth/contexto'
import { useLogin } from '@/auth/sessao'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'
import { destinoAposLogin } from '@/layout/destino'
import { validadorDeCampo } from './login.schema'
import type { Credenciais } from './login.schema'
import './Login.css'

const { Title, Paragraph, Text } = Typography

/**
 * `RF-ACS-01` — autenticação pela identidade institucional.
 *
 * Composição visual de Gabriel Ugione (commit `dbfb26f`), preservada.
 *
 * Três correções em relação ao original, todas de requisito:
 *
 * 1. **Um formulário, não três.** O original tinha um card de acesso por perfil,
 *    o usuário escolhendo se entra como gestor, técnico ou pesquisador. O
 *    `RF-ACS-02` não permite: o perfil vem do servidor junto da sessão
 *    (`POST /api/sessao` devolve `usuario.perfil`). Escolher o próprio perfil na
 *    tela é autorização decidida no cliente.
 * 2. **Mensagem de erro**, que o card do Trello pede e não existia. Com
 *    `role="alert"`, para o leitor de tela anunciar (`RNF-10`).
 * 3. **Validação por Zod**, o padrão da equipe para formulário.
 *
 * ⚠️ **O acesso local não é gambiarra de semestre.** O `RF-ACS-01` exige acesso
 * administrativo independente do SSO, para não perder o sistema se o ID-UFSC
 * cair — e o ID-UFSC depende do SETIC (`PEN-09`).
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
    <div className="loginContainer">
      <div className="leftPanel">
        <div className="mainContent">
          <header className="headerSection">
            <Title level={2} className="headerTitle">
              <ExperimentOutlined className="headerIcon" aria-hidden="true" /> Nidus
            </Title>
            <Text className="headerSubtitle">Sistema de Gestão de Biotério — CPMR / UFSC</Text>
          </header>

          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card title="Acesso ao sistema" size="small" className="loginCard">
                {/* RNF-10: role="alert" faz o leitor de tela anunciar o erro
                    assim que ele aparece, sem o usuário ter que procurar. */}
                {erro && (
                  <Alert
                    type="error"
                    showIcon
                    message={erro}
                    role="alert"
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Form<Credenciais>
                  layout="vertical"
                  onFinish={aoEnviar}
                  requiredMark={false}
                  disabled={login.isPending}
                >
                  <Form.Item
                    name="email"
                    label="E-mail institucional"
                    rules={[{ validator: validadorDeCampo('email') }]}
                  >
                    <Input
                      prefix={<UserOutlined aria-hidden="true" />}
                      placeholder="nome@ufsc.br"
                      autoComplete="username"
                      inputMode="email"
                      autoFocus
                    />
                  </Form.Item>

                  <Form.Item
                    name="senha"
                    label="Senha"
                    rules={[{ validator: validadorDeCampo('senha') }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined aria-hidden="true" />}
                      placeholder="Senha"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    className="btnSubmit"
                    loading={login.isPending}
                  >
                    Entrar
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <div className="infoBox">
                <div>
                  <div className="infoBoxHeader">
                    <InfoCircleOutlined className="infoIcon" aria-hidden="true" />{' '}
                    <Text className="infoTitle">Biotério Central UFSC</Text>
                  </div>
                  <Text className="infoText">
                    Unidade dedicada à criação, controle e suporte na manutenção de roedores para
                    atividades de pesquisa e ensino da universidade.
                  </Text>
                </div>

                <div className="devBox">
                  <Text className="devTitle" id="rotulo-acesso-dev">
                    Acesso de desenvolvimento — o login pelo ID-UFSC depende do SETIC e entra como
                    mock no semestre.
                  </Text>
                  <Space size={8} wrap role="group" aria-labelledby="rotulo-acesso-dev">
                    {(Object.keys(PERFIS) as Perfil[]).map((chave) => (
                      <Button
                        key={chave}
                        size="small"
                        onClick={() => entrarSemApi(chave)}
                      >
                        {PERFIS[chave].rotulo}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <footer className="bottomWhiteBar">
          <div className="bottomBarContent">
            <Title level={4} className="bottomBarTitle">
              Centro de Pesquisas Biológicas
            </Title>
            <Paragraph className="bottomBarText">
              Plataforma restrita para controle de matrizes, linhagens e alocação de roedores. Para
              dúvidas operacionais ou cadastro de pesquisadores, entre em contato com a administração
              do CPMR / UFSC.
            </Paragraph>
          </div>
        </footer>
      </div>

      {/* Decorativa: o conteúdo não depende dela, então fica fora da leitura. */}
      <div className="sideImage" role="presentation" />
    </div>
  )
}
