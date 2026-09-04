import { LogoutOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, Select, Space, Tag, Tooltip, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import { usePerfil } from '@/auth/contexto'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'
import { menuDoPerfil, rotaInicial } from './navegacao'

const { Header, Content, Sider } = Layout

/**
 * Casca da aplicação: cabeçalho, navegação por perfil e área de conteúdo.
 *
 * O seletor de perfil só aparece quando **não há sessão real** — é o andaime de
 * desenvolvimento, para percorrer as telas dos três atores sem API. Havendo
 * usuário logado, o cabeçalho mostra o nome e o perfil que o servidor
 * devolveu, sem opção de trocar: quem decide o perfil é o servidor
 * (`RF-ACS-02`).
 */
export function AppLayout() {
  const { perfil, usuario, entrarComoDesenvolvimento, sair, saindo } = usePerfil()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  if (!perfil) return null

  const itens = menuDoPerfil(perfil).map((item) => ({
    key: item.caminho,
    label: item.rotulo,
  }))

  const selecionado = itens.find((i) => pathname.startsWith(i.key))?.key

  function trocarPerfilDeDesenvolvimento(novo: Perfil) {
    entrarComoDesenvolvimento(novo)
    navegar(rotaInicial(novo))
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingInline: 20,
        }}
      >
        <Space align="center" size={12}>
          <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
            Nidus
          </Typography.Text>
          <Typography.Text style={{ color: 'rgba(255,255,255,.65)' }}>CPMR/UFSC</Typography.Text>
          {mostrarRotuloDeAmbiente && <Tag color="orange">{config.ambiente}</Tag>}
        </Space>

        <Space align="center" size={12}>
          {usuario ? (
            <Typography.Text style={{ color: 'rgba(255,255,255,.85)' }}>
              {usuario.nome} · {PERFIS[usuario.perfil].rotulo}
            </Typography.Text>
          ) : (
            <Space align="center" size={8}>
              <Tooltip title="Sem sessão no servidor: perfil de desenvolvimento, para percorrer as telas.">
                <Typography.Text style={{ color: 'rgba(255,255,255,.65)' }}>Perfil</Typography.Text>
              </Tooltip>
              <Select<Perfil>
                value={perfil}
                onChange={trocarPerfilDeDesenvolvimento}
                style={{ width: 170 }}
                options={Object.entries(PERFIS).map(([valor, meta]) => ({
                  value: valor as Perfil,
                  label: meta.rotulo,
                }))}
              />
            </Space>
          )}

          <Button
            type="text"
            icon={<LogoutOutlined aria-hidden="true" />}
            onClick={sair}
            loading={saindo}
            style={{ color: 'rgba(255,255,255,.85)' }}
          >
            Sair
          </Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={240} breakpoint="lg" collapsedWidth={0} theme="light">
          <Menu
            mode="inline"
            items={itens}
            {...(selecionado ? { selectedKeys: [selecionado] } : {})}
            onClick={({ key }) => navegar(key)}
            style={{ height: '100%', borderInlineEnd: 0 }}
          />
        </Sider>

        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
