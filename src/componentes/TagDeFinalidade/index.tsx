import { Tag } from 'antd'
import type { FinalidadeCaixa } from '@/dominio/tipos'

/** para que serve a caixa - reprodução, maternidade, recria, expedição */
const ROTULO: Record<FinalidadeCaixa, string> = {
  reproducao: 'Reprodução',
  maternidade: 'Maternidade',
  recria: 'Recria',
  expedicao: 'Expedição',
}

export function TagDeFinalidade({ finalidade }: { finalidade: FinalidadeCaixa }) {
  return <Tag bordered>{ROTULO[finalidade]}</Tag>
}
