import { Layout, Menu, Select, Space, Tag, Typography } from 'antd'
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
 * O seletor de perfil no cabeçalho é **andaime de desenvolvimento** — existe
 * para percorrer as telas dos três atores sem autenticação real. Sai quando a
 * decisão de autenticação entrar.
 */
export function AppLayout() {
  const { perfil, entrar } = usePerfil()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  if (!perfil) return null

  const itens = menuDoPerfil(perfil).map((item) => ({
    key: item.caminho,
    label: item.rotulo,
  }))

  const selecionado = itens.find((i) => pathname.startsWith(i.key))?.key

  function trocarPerfil(novo: Perfil) {
    entrar(novo)
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

        <Space align="center" size={8}>
          <Typography.Text style={{ color: 'rgba(255,255,255,.65)' }}>Perfil</Typography.Text>
          <Select<Perfil>
            value={perfil}
            onChange={trocarPerfil}
            style={{ width: 170 }}
            options={Object.entries(PERFIS).map(([valor, meta]) => ({
              value: valor as Perfil,
              label: meta.rotulo,
            }))}
          />
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
