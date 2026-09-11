import { Tag } from 'antd'
import type { FinalidadeCaixa } from '@/dominio/tipos'

/**
 * Para que serve a caixa — reprodução, maternidade, recria, expedição.
 *
 * Vocabulário do glossário da seção 2 do documento de requisitos. A equipe
 * não conhece o vocabulário de biotério: são estes nomes na interface, sem
 * sinônimo inventado.
 *
 * Neutra de propósito: finalidade é cadastro, não estado. Quem carrega cor no
 * card é o estado de comprometimento (`@/dominio/estados`), e duas escalas de
 * cor no mesmo card competem em vez de informar.
 */
const ROTULO: Record<FinalidadeCaixa, string> = {
  reproducao: 'Reprodução',
  maternidade: 'Maternidade',
  recria: 'Recria',
  expedicao: 'Expedição',
}

export function TagDeFinalidade({ finalidade }: { finalidade: FinalidadeCaixa }) {
  return <Tag bordered>{ROTULO[finalidade]}</Tag>
}
