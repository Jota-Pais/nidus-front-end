import { Tag, Tooltip } from 'antd'
import type { CodigoEspecie } from '@/dominio/tipos'

const ESPECIE: Record<CodigoEspecie, { rotulo: string; cientifico: string }> = {
  rato: { rotulo: 'Rato', cientifico: 'Rattus norvegicus' },
  camundongo: { rotulo: 'Camundongo', cientifico: 'Mus musculus' },
}

/** A espécie da caixa, do casal ou do quadro */
export function TagDeEspecie({ especie }: { especie: CodigoEspecie }) {
  const meta = ESPECIE[especie]
  return (
    <Tooltip title={meta.cientifico}>
      <Tag bordered>{meta.rotulo}</Tag>
    </Tooltip>
  )
}
