/**
 * Menu por perfil.
 *
 * ⚠️ Esconder item de menu é **conveniência**, não segurança. O `RF-ACS-02` é
 * explícito: "o cliente pode esconder um botão por conveniência, mas nunca
 * autoriza". Toda rota aqui continua tendo que ser barrada no servidor.
 *
 * A ordem importa: para o técnico, o painel de alertas vem primeiro porque é a
 * tela em que ele começa o dia (`RF-REP-07`).
 */
import type { Perfil } from '@/dominio/tipos'

export interface ItemDeMenu {
  chave: string
  rotulo: string
  caminho: string
  perfis: Perfil[]
}

export const ITENS_DE_MENU: ItemDeMenu[] = [
  {
    chave: 'alertas',
    rotulo: 'Alertas do ciclo',
    caminho: '/alertas',
    perfis: ['tecnico', 'gestor'],
  },
  {
    chave: 'grade',
    rotulo: 'Grade de estantes',
    caminho: '/grade',
    perfis: ['tecnico', 'gestor'],
  },
  {
    chave: 'quadro',
    rotulo: 'Quadro de comprometimento',
    caminho: '/quadro',
    perfis: ['tecnico', 'gestor'],
  },
  {
    chave: 'registros',
    rotulo: 'Registros do técnico',
    caminho: '/registros',
    perfis: ['tecnico', 'gestor'],
  },
  {
    chave: 'solicitacoes',
    rotulo: 'Solicitações',
    caminho: '/solicitacoes',
    perfis: ['pesquisador', 'tecnico', 'gestor'],
  },
  {
    chave: 'infraestrutura',
    rotulo: 'Infraestrutura',
    caminho: '/infraestrutura',
    perfis: ['gestor'],
  },
  {
    chave: 'projetos',
    rotulo: 'Projetos e cotas',
    caminho: '/projetos',
    perfis: ['gestor'],
  },
]

export function menuDoPerfil(perfil: Perfil): ItemDeMenu[] {
  return ITENS_DE_MENU.filter((item) => item.perfis.includes(perfil))
}

/**
 * Onde cada perfil cai depois do login.
 *
 * O pesquisador **não enxerga a colônia** (`RF-ACS-*`), então cai nas próprias
 * solicitações. O técnico cai nos alertas.
 */
export function rotaInicial(perfil: Perfil): string {
  return perfil === 'pesquisador' ? '/solicitacoes' : '/alertas'
}
