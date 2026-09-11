import { Tag, Tooltip } from 'antd'
import type { CodigoEspecie } from '@/dominio/tipos'

const ESPECIE: Record<CodigoEspecie, { rotulo: string; cientifico: string }> = {
  rato: { rotulo: 'Rato', cientifico: 'Rattus norvegicus' },
  camundongo: { rotulo: 'Camundongo', cientifico: 'Mus musculus' },
}

/**
 * A espécie da caixa, do casal ou do quadro.
 *
 * ⚠️ **A espécie nunca é decoração no Nidus.** O `RF-CIC-01` proíbe misturar
 * espécies no mesmo quadro e a segregação é aplicada no servidor — mostrar
 * qual espécie está na tela é o que impede alguém de achar que está vendo a
 * colônia inteira quando está vendo metade dela.
 *
 * O nome científico vai no `title`: é como o pesquisador escreve no projeto
 * de ética, e a conferência acontece por ele.
 */
export function TagDeEspecie({ especie }: { especie: CodigoEspecie }) {
  const meta = ESPECIE[especie]
  return (
    <Tooltip title={meta.cientifico}>
      <Tag bordered>{meta.rotulo}</Tag>
    </Tooltip>
  )
}
