import {
  ExperimentOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { App as AntApp, Button, Card, Col, Form, Input, Row, Space, Typography } from 'antd'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { usePerfil } from '@/auth/contexto'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'
import { rotaInicial } from '@/layout/navegacao'
import './Login.css'

const { Title, Paragraph, Text } = Typography

/**
 * `RF-ACS-01` — autenticação pela identidade institucional.
 *
 * Composição visual de Gabriel Ugione (commit `dbfb26f`), preservada. Duas
 * mudanças em relação ao original:
 *
 * 1. **Um formulário, não três.** O original tinha um card de acesso por perfil,
 *    com o usuário escolhendo se entra como gestor, técnico ou pesquisador.
 *    O `RF-ACS-02` não permite: o perfil vem do servidor, junto da sessão
 *    (`POST /api/sessao` devolve `usuario.perfil`). Deixar o usuário escolher
 *    seria autorização decidida no cliente.
 * 2. **Validação por Zod**, que é o padrão da equipe para formulário.
 *
 * ⚠️ A API ainda não existe: o card "Camada de acesso à API" é o próximo do
 * backlog. Até lá o formulário valida mas não envia, e os botões de
 * desenvolvimento abaixo dele é que navegam.
 *
 * O `RF-ACS-01` também exige **acesso administrativo local** independente do
 * SSO, para não perder o sistema se o ID-UFSC cair. Não é gambiarra temporária.
 */

const credenciais = z.object({
  email: z.string().min(1, 'Informe o e-mail institucional').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
})

type Credenciais = z.infer<typeof credenciais>

export function Login() {
  const { perfil, entrar } = usePerfil()
  const navegar = useNavigate()
  const { message } = AntApp.useApp()

  if (perfil) return <Navigate to={rotaInicial(perfil)} replace />

  function aoEnviar(valores: Credenciais) {
    const resultado = credenciais.safeParse(valores)
    if (!resultado.success) return
    message.info('A API de sessão ainda não está conectada — card "Camada de acesso à API".')
  }

  function entrarComoDesenvolvimento(escolhido: Perfil) {
    entrar(escolhido)
    navegar(rotaInicial(escolhido))
  }

  return (
    <div className="loginContainer">
      <div className="leftPanel">
        <div className="mainContent">
          <div className="headerSection">
            <Title level={2} className="headerTitle">
              <ExperimentOutlined className="headerIcon" /> Nidus
            </Title>
            <Text className="headerSubtitle">Sistema de Gestão de Biotério — CPMR / UFSC</Text>
          </div>

          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card title="Acesso ao sistema" size="small" className="loginCard">
                <Form<Credenciais> layout="vertical" onFinish={aoEnviar} requiredMark={false}>
                  <Form.Item
                    name="email"
                    label="E-mail institucional"
                    rules={[
                      {
                        validator: (_, valor) => {
                          const r = credenciais.shape.email.safeParse(valor ?? '')
                          return r.success
                            ? Promise.resolve()
                            : Promise.reject(new Error(r.error.issues[0]?.message))
                        },
                      },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="nome@ufsc.br" autoComplete="username" />
                  </Form.Item>

                  <Form.Item
                    name="senha"
                    label="Senha"
                    rules={[
                      {
                        validator: (_, valor) => {
                          const r = credenciais.shape.senha.safeParse(valor ?? '')
                          return r.success
                            ? Promise.resolve()
                            : Promise.reject(new Error(r.error.issues[0]?.message))
                        },
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Senha"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" block className="btnSubmit">
                    Entrar
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <div className="infoBox">
                <div>
                  <div className="infoBoxHeader">
                    <InfoCircleOutlined className="infoIcon" />{' '}
                    <Text className="infoTitle">Biotério Central UFSC</Text>
                  </div>
                  <Text className="infoText">
                    Unidade dedicada à criação, controle e suporte na manutenção de roedores para
                    atividades de pesquisa e ensino da universidade.
                  </Text>
                </div>

                <div className="devBox">
                  <Text className="devTitle">
                    Acesso de desenvolvimento — o login pelo ID-UFSC depende do SETIC e entra como
                    mock no semestre.
                  </Text>
                  <Space size={8} wrap>
                    {(Object.keys(PERFIS) as Perfil[]).map((chave) => (
                      <Button key={chave} size="small" onClick={() => entrarComoDesenvolvimento(chave)}>
                        {PERFIS[chave].rotulo}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="bottomWhiteBar">
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
        </div>
      </div>

      <div className="sideImage" />
    </div>
  )
}
