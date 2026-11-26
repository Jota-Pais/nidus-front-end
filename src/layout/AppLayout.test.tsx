import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PerfilContext } from '@/auth/contexto'
import type { Perfil } from '@/dominio/tipos'
import { larguraDaTela } from '@/testes/tela'
import { AppLayout } from './AppLayout'

const NOME_DO_MENU = 'Menu da conta de Gilda Gestora'

/** A casca com uma sessão de teste. O `renderizar` fixa a sessão, e aqui o teste escolhe o Sair */
function abrirCasca(perfil: Perfil, { sair = () => {}, saindo = false, caminho = '/' } = {}) {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <PerfilContext.Provider
        value={{
          perfil,
          usuario: { id: 1, nome: 'Gilda Gestora', email: 'gilda@ufsc.br', perfil },
          sair,
          saindo,
        }}
      >
        <AppLayout />
      </PerfilContext.Provider>
    </MemoryRouter>,
  )
}

const gatilho = () => screen.getByRole('button', { name: NOME_DO_MENU })

describe('telas no celular', () => {
  it('ficam numa barra embaixo, com a tela aberta em destaque, sem menu lateral nem botão de menu', () => {
    const voltar = larguraDaTela(390)
    abrirCasca('tecnico', { caminho: '/estantes' })

    const barra = screen.getByRole('navigation', { name: 'Telas' })
    const telas = within(barra).getAllByRole('link')
    expect(telas.map((tela) => tela.textContent)).toEqual(['Visão geral', 'Estantes', 'Pedidos'])
    expect(within(barra).getByRole('link', { name: 'Estantes' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(within(barra).getByRole('link', { name: 'Pedidos' }).getAttribute('href')).toBe(
      '/pedidos',
    )

    expect(screen.queryByRole('button', { name: 'Abrir o menu' })).toBeNull()
    expect(document.querySelector('.ant-layout-sider')).toBeNull()
    voltar()
  })

  it('quem tem uma tela só não tem barra', () => {
    const voltar = larguraDaTela(390)
    abrirCasca('pesquisador', { caminho: '/pedidos' })

    expect(screen.queryByRole('navigation', { name: 'Telas' })).toBeNull()
    voltar()
  })
})

describe('menu das telas no tablet', () => {
  it('abre pelo botão do cabeçalho, sem gatilho em cima da tela, e fecha ao escolher a tela', async () => {
    const voltar = larguraDaTela(800)
    abrirCasca('tecnico')

    expect(screen.queryByRole('navigation', { name: 'Telas' })).toBeNull()
    expect(document.querySelector('.ant-layout-sider-zero-width-trigger')).toBeNull()
    const abrir = await screen.findByRole('button', { name: 'Abrir o menu' })
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeTruthy()

    fireEvent.click(abrir)
    expect(
      screen.getByRole('button', { name: 'Fechar o menu' }).getAttribute('aria-expanded'),
    ).toBe('true')
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeNull()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Estantes' }))
    expect(screen.getByRole('button', { name: 'Abrir o menu' })).toBeTruthy()
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeTruthy()
    voltar()
  })

  it('na tela larga, a barra fica aberta e não há botão de menu nem barra embaixo', () => {
    const voltar = larguraDaTela(1280)
    abrirCasca('tecnico')

    expect(screen.queryByRole('button', { name: 'Abrir o menu' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Telas' })).toBeNull()
    expect(document.querySelector('.ant-layout-sider-collapsed')).toBeNull()
    voltar()
  })
})

describe('menu da conta', () => {
  it('no cabeçalho fica só o nome; Configurações e Sair abrem num menu', async () => {
    abrirCasca('gestor')

    expect(gatilho().getAttribute('aria-haspopup')).toBe('menu')
    expect(gatilho().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Sair')).toBeNull()

    fireEvent.click(gatilho())

    expect(await screen.findByText('Configurações')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Cadastros' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Histórico' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Contas' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /Sair/ })).toBeTruthy()
    expect(gatilho().getAttribute('aria-expanded')).toBe('true')
  })

  it('o técnico tem Cadastros em Configurações, sem o Histórico e as Contas', async () => {
    abrirCasca('tecnico')

    fireEvent.click(gatilho())

    expect(await screen.findByText('Configurações')).toBeTruthy()
    // a barra lateral também tem itens de menu: aqui conta só o menu da conta
    const menuDaConta = document.querySelector<HTMLElement>('.ant-dropdown')!
    const itens = within(menuDaConta).getAllByRole('menuitem')
    expect(itens.map((i) => i.textContent)).toEqual(['Cadastros', 'Tema escuro', 'Sair'])
  })

  it('quem não tem nada a configurar abre o menu só com o tema e o Sair', async () => {
    abrirCasca('pesquisador')

    fireEvent.click(gatilho())

    expect(await screen.findByRole('menuitem', { name: /Sair/ })).toBeTruthy()
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual([
      'Tema escuro',
      'Sair',
    ])
    expect(screen.queryByText('Configurações')).toBeNull()
  })

  it('Sair encerra a sessão e deixa o menu aberto até ela cair', async () => {
    const sair = vi.fn()
    abrirCasca('pesquisador', { sair })

    fireEvent.click(gatilho())
    fireEvent.click(await screen.findByRole('menuitem', { name: /Sair/ }))

    expect(sair).toHaveBeenCalledTimes(1)
    expect(gatilho().getAttribute('aria-expanded')).toBe('true')
  })

  it('enquanto sai, o item diz Saindo… e não aceita outro clique', async () => {
    const sair = vi.fn()
    abrirCasca('pesquisador', { sair, saindo: true })

    fireEvent.click(gatilho())
    const saindo = await screen.findByRole('menuitem', { name: /Saindo…/ })
    fireEvent.click(saindo)

    expect(saindo.getAttribute('aria-disabled')).toBe('true')
    expect(sair).not.toHaveBeenCalled()
  })
})
