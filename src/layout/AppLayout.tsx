import { DownOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { Dropdown, Layout, Menu } from 'antd'
import { Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Botao, Etiqueta, Linha, Texto } from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import { usePerfil } from '@/auth/contexto'
import { Carregando } from './Carregando'
import { configuracoesDoPerfil, menuDoPerfil, mostraBarraLateral } from './navegacao'
import './appLayout.css'

const { Header, Content, Sider } = Layout

/** casca da aplicação: cabeçalho, navegação por perfil e área de conteúdo */
export function AppLayout() {
  const { perfil, usuario, sair, saindo } = usePerfil()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  if (!perfil || !usuario) return null

  const itens = menuDoPerfil(perfil).map((item) => ({
    key: item.caminho,
    label: item.rotulo,
  }))

  const selecionado = itens.find((i) => pathname.startsWith(i.key))?.key

  const configuracoes = configuracoesDoPerfil(perfil).map((item) => ({
    key: item.caminho,
    label: item.rotulo,
  }))
  const configuracaoAberta = configuracoes.find((i) => pathname.startsWith(i.key))?.key

  return (
    <Layout className="casca">
      <Header className="casca__topo">
        <Linha espaco={12}>
          {/* A marca leva as duas cores principais: o símbolo em Verde
              Bandeira, o nome em branco sobre o azul institucional. */}
          <span className="casca__marca" aria-hidden="true" />
          <span className="casca__nome">Nidus</span>
          {mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>}

          {configuracoes.length > 0 && (
            <Dropdown
              trigger={['click']}
              menu={{
                items: configuracoes,
                selectable: true,
                ...(configuracaoAberta ? { selectedKeys: [configuracaoAberta] } : {}),
                onClick: ({ key }) => navegar(key),
              }}
            >
              <Botao
                variante="fantasma"
                icon={<SettingOutlined aria-hidden="true" />}
                className={`casca__config${configuracaoAberta ? ' casca__config--ativa' : ''}`}
                aria-label="Configurações"
              >
                <span className="casca__configTexto">Configurações</span>
                <DownOutlined aria-hidden="true" className="casca__seta" />
              </Botao>
            </Dropdown>
          )}
        </Linha>

        <Linha espaco={12}>
          <Texto className="casca__usuario">{usuario.nome}</Texto>

          <Botao
            variante="fantasma"
            icon={<LogoutOutlined aria-hidden="true" />}
            onClick={sair}
            loading={saindo}
            className="casca__sair"
          >
            Sair
          </Botao>
        </Linha>
      </Header>

      <Layout>
        {mostraBarraLateral(perfil) && (
          <Sider
            width={248}
            breakpoint="lg"
            collapsedWidth={0}
            theme="light"
            className="casca__lado"
          >
            <Menu
              mode="inline"
              items={itens}
              {...(selecionado ? { selectedKeys: [selecionado] } : {})}
              onClick={({ key }) => navegar(key)}
              className="casca__menu"
            />
          </Sider>
        )}

        <Content className="casca__conteudo">
          <Suspense fallback={<Carregando />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}
