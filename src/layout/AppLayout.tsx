import { DownOutlined, LoadingOutlined, LogoutOutlined } from '@ant-design/icons'
import { Dropdown, Layout, Menu } from 'antd'
import type { DropdownProps, MenuProps } from 'antd'
import { Suspense, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Botao, Etiqueta, Linha } from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import { usePerfil } from '@/auth/contexto'
import { Carregando } from './Carregando'
import { configuracoesDoPerfil, menuDoPerfil, mostraBarraLateral } from './navegacao'
import './appLayout.css'

const { Header, Content, Sider } = Layout

/** A chave do Sair no menu da conta. As outras opções usam o caminho da tela como chave */
const SAIR = 'sair'

/** casca da aplicação: cabeçalho, navegação por perfil e área de conteúdo */
export function AppLayout() {
  const { perfil, usuario, sair, saindo } = usePerfil()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const [contaAberta, setContaAberta] = useState(false)

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

  const opcaoDeSair = {
    key: SAIR,
    label: saindo ? 'Saindo…' : 'Sair',
    icon: saindo ? <LoadingOutlined aria-hidden="true" /> : <LogoutOutlined aria-hidden="true" />,
    disabled: saindo,
  }

  // As configurações do perfil vêm agrupadas e separadas do Sair. Quem não tem nada a
  // configurar abre o menu só com o Sair
  const opcoesDaConta: MenuProps['items'] =
    configuracoes.length > 0
      ? [
          { type: 'group', label: 'Configurações', children: configuracoes },
          { type: 'divider' },
          opcaoDeSair,
        ]
      : [opcaoDeSair]

  // O menu abre e fecha pelo nome, pelo clique fora e pelo Esc. Escolher uma opção só fecha o
  // menu quando ela leva a outra tela: no Sair ele fica aberto, mostrando o "Saindo…" até a
  // sessão cair
  const aoAbrirOuFechar: DropdownProps['onOpenChange'] = (aberto, { source }) => {
    if (source === 'trigger') setContaAberta(aberto)
  }

  const aoEscolher: MenuProps['onClick'] = ({ key }) => {
    if (key === SAIR) {
      sair()
      return
    }
    setContaAberta(false)
    navegar(key)
  }

  return (
    <Layout className="casca">
      <Header className="casca__topo">
        {/* A marca não encolhe: no celular, quem cede espaço é o nome de quem entrou */}
        <Linha espaco={12} estilo={{ flexShrink: 0 }}>
          {/* A marca leva as duas cores principais: o símbolo em Verde
              Bandeira, o nome em branco sobre o azul institucional. */}
          <span className="casca__marca" aria-hidden="true" />
          <span className="casca__nome">Nidus</span>
          {mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>}
        </Linha>

        {/* Ao abrir, o foco vai para a primeira opção: pelo teclado, Enter abre, as setas
            andam pelas opções e Esc fecha e devolve o foco ao nome */}
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          open={contaAberta}
          onOpenChange={aoAbrirOuFechar}
          autoFocus
          menu={{
            items: opcoesDaConta,
            selectedKeys: configuracaoAberta ? [configuracaoAberta] : [],
            onClick: aoEscolher,
          }}
        >
          <Botao
            variante="fantasma"
            className="casca__conta"
            aria-label={`Menu da conta de ${usuario.nome}`}
            aria-haspopup="menu"
            aria-expanded={contaAberta}
          >
            <span className="casca__usuario">{usuario.nome}</span>
            <DownOutlined aria-hidden="true" className="casca__seta" />
          </Botao>
        </Dropdown>
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
