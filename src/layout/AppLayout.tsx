import { LogoutOutlined } from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Botao, Etiqueta, Linha, Texto } from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import { usePerfil } from '@/auth/contexto'
import { PERFIS } from '@/dominio/tipos'
import { menuDoPerfil } from './navegacao'
import './appLayout.css'

const { Header, Content, Sider } = Layout

/**
 * Casca da aplicação: cabeçalho, navegação por perfil e área de conteúdo.
 *
 * O cabeçalho é a faixa invertida do design system — azul institucional
 * escuro, a mesma cor da tela de entrada. É a moldura que o usuário tem
 * diante dos olhos o turno inteiro, então carrega a identidade e mais nada:
 * nenhum número, nenhum alerta, nada que mude sozinho e puxe o olho para
 * fora do trabalho.
 *
 * O cabeçalho mostra o nome e o perfil que o servidor devolveu, sem opção de
 * trocar: quem decide o perfil é o servidor (`RF-ACS-02`). Só chega até aqui
 * quem tem sessão real — sem ela, `RotaProtegida` já mandou para o login.
 */
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

  return (
    <Layout className="casca">
      <Header className="casca__topo">
        <Linha espaco={12}>
          {/* A marca leva as duas cores principais: o símbolo em Verde
              Bandeira, o nome em branco sobre o azul institucional. */}
          <span className="casca__marca" aria-hidden="true" />
          <span className="casca__nome">Nidus</span>
          <Texto tom="secundario" className="casca__instituicao">
            CPMR/UFSC
          </Texto>
          {mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>}
        </Linha>

        <Linha espaco={12}>
          <Texto className="casca__usuario">
            {usuario.nome} · {PERFIS[usuario.perfil].rotulo}
          </Texto>

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
        <Sider width={248} breakpoint="lg" collapsedWidth={0} theme="light" className="casca__lado">
          <Menu
            mode="inline"
            items={itens}
            {...(selecionado ? { selectedKeys: [selecionado] } : {})}
            onClick={({ key }) => navegar(key)}
            className="casca__menu"
          />
        </Sider>

        <Content className="casca__conteudo">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
