import { SwapOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import { COLUNAS_DO_QUADRO, ESTADO_CAIXA } from '@/dominio/estados'
import type { EstadoCaixa } from '@/dominio/tipos'
import { Botao } from '../Botao'

/** "Mover para" - a transição de estado do card, RF-CIC-03 */
export function BotaoDeMoverEstado({
  atual,
  aoMover,
  carregando = false,
  desabilitado = false,
}: {
  atual: EstadoCaixa
  aoMover: (destino: EstadoCaixa) => void
  carregando?: boolean
  desabilitado?: boolean
}) {
  const destinos = COLUNAS_DO_QUADRO.filter((estado) => estado !== atual)

  return (
    <Dropdown
      trigger={['click']}
      disabled={desabilitado || carregando}
      menu={{
        items: destinos.map((estado) => ({
          key: estado,
          label: `${ESTADO_CAIXA[estado].marcador}  ${ESTADO_CAIXA[estado].rotulo}`,
        })),
        onClick: ({ key }) => aoMover(key as EstadoCaixa),
      }}
    >
      <Botao
        variante="secundario"
        size="small"
        block
        loading={carregando}
        icon={<SwapOutlined aria-hidden="true" />}
      >
        Mover para
      </Botao>
    </Dropdown>
  )
}
