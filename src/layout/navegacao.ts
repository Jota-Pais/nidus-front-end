// Menu por perfil - conveniência de navegação. Quem decide o acesso é o servidor
import type { Perfil } from '@/dominio/tipos'

interface ItemDeMenu {
  rotulo: string
  caminho: string
  perfis: Perfil[]
}

const ITENS_DE_MENU: ItemDeMenu[] = [
  { rotulo: 'Kanban', caminho: '/kanban', perfis: ['tecnico', 'gestor'] },
  { rotulo: 'Estantes', caminho: '/estantes', perfis: ['tecnico', 'gestor'] },
  { rotulo: 'Solicitar animais', caminho: '/solicitar', perfis: ['pesquisador', 'tecnico', 'gestor'] },
  { rotulo: 'Busca de atendimento', caminho: '/busca', perfis: ['tecnico', 'gestor'] },
]

export function menuDoPerfil(perfil: Perfil): ItemDeMenu[] {
  return ITENS_DE_MENU.filter((item) => item.perfis.includes(perfil))
}

/** A barra lateral só aparece quando há mais de uma tela para escolher */
export function mostraBarraLateral(perfil: Perfil): boolean {
  return menuDoPerfil(perfil).length > 1
}

/** Onde cada perfil cai depois do login */
export function rotaInicial(perfil: Perfil): string {
  return perfil === 'pesquisador' ? '/solicitar' : '/kanban'
}
