import { LogoutOutlined } from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Botao, Dica, Etiqueta, Linha, Seletor, Texto } from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import { usePerfil } from '@/auth/contexto'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'
import { menuDoPerfil, rotaInicial } from './navegacao'
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
 * O seletor de perfil só aparece quando **não há sessão real** — é o andaime
 * de desenvolvimento, para percorrer as telas dos três atores sem API. Havendo
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
          {usuario ? (
            <Texto className="casca__usuario">
              {usuario.nome} · {PERFIS[usuario.perfil].rotulo}
            </Texto>
          ) : (
            <Linha espaco={8}>
              <Dica texto="Sem sessão no servidor: perfil de desenvolvimento, para percorrer as telas.">
                <Texto className="casca__usuario">Perfil</Texto>
              </Dica>
              <Seletor<Perfil>
                value={perfil}
                onChange={trocarPerfilDeDesenvolvimento}
                style={{ width: 180 }}
                options={Object.entries(PERFIS).map(([valor, meta]) => ({
                  value: valor as Perfil,
                  label: meta.rotulo,
                }))}
              />
            </Linha>
          )}

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
