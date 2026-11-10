// Menu por perfil - conveniência de navegação. Quem decide o acesso é o servidor
import type { Perfil } from '@/dominio/tipos'

interface ItemDeMenu {
  rotulo: string
  caminho: string
  perfis: Perfil[]
}

const ITENS_DE_MENU: ItemDeMenu[] = [
  { rotulo: 'Visão geral', caminho: '/visao-geral', perfis: ['tecnico', 'gestor'] },
  { rotulo: 'Estantes', caminho: '/estantes', perfis: ['tecnico', 'gestor'] },
  { rotulo: 'Pedir animais', caminho: '/pedidos', perfis: ['pesquisador'] },
  { rotulo: 'Pedidos', caminho: '/pedidos', perfis: ['tecnico', 'gestor'] },
]

/** O que fica em Configurações, no menu da conta do cabeçalho, fora do menu do dia a dia */
const ITENS_DE_CONFIGURACAO: ItemDeMenu[] = [
  { rotulo: 'Cadastros', caminho: '/cadastros', perfis: ['gestor'] },
  { rotulo: 'Histórico', caminho: '/historico', perfis: ['gestor'] },
  { rotulo: 'Usuários', caminho: '/usuarios', perfis: ['gestor'] },
]

export function menuDoPerfil(perfil: Perfil): ItemDeMenu[] {
  return ITENS_DE_MENU.filter((item) => item.perfis.includes(perfil))
}

/** Vazio para quem não tem nada a configurar: aí o menu da conta fica só com o Sair */
export function configuracoesDoPerfil(perfil: Perfil): ItemDeMenu[] {
  return ITENS_DE_CONFIGURACAO.filter((item) => item.perfis.includes(perfil))
}

/** A barra lateral só aparece quando há mais de uma tela para escolher */
export function mostraBarraLateral(perfil: Perfil): boolean {
  return menuDoPerfil(perfil).length > 1
}

/** Onde cada perfil cai depois do login */
export function rotaInicial(perfil: Perfil): string {
  return perfil === 'pesquisador' ? '/pedidos' : '/visao-geral'
}
