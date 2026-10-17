// Menu por perfil - conveniência de navegação. Quem decide o acesso é o servidor
import type { Perfil } from '@/dominio/tipos'

export interface ItemDeMenu {
  rotulo: string
  caminho: string
  perfis: Perfil[]
}

export const ITENS_DE_MENU: ItemDeMenu[] = [
  { rotulo: 'Kanban', caminho: '/kanban', perfis: ['tecnico', 'gestor'] },
  { rotulo: 'Estantes', caminho: '/estantes', perfis: ['tecnico', 'gestor'] },
  { rotulo: 'Solicitar animais', caminho: '/solicitar', perfis: ['pesquisador', 'tecnico', 'gestor'] },
  { rotulo: 'Busca de atendimento', caminho: '/busca', perfis: ['tecnico', 'gestor'] },
]

export function menuDoPerfil(perfil: Perfil): ItemDeMenu[] {
  return ITENS_DE_MENU.filter((item) => item.perfis.includes(perfil))
}

/** Onde cada perfil cai depois do login */
export function rotaInicial(perfil: Perfil): string {
  return perfil === 'pesquisador' ? '/solicitar' : '/kanban'
}
