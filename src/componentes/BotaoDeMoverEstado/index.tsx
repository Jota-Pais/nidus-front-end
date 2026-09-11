import { SwapOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import { COLUNAS_DO_QUADRO, ESTADO_CAIXA } from '@/dominio/estados'
import type { EstadoCaixa } from '@/dominio/tipos'
import { Botao } from '../Botao'

/**
 * "Mover para" — a transição de estado do card, `RF-CIC-03`.
 *
 * ⚠️ **É este botão, e não arrastar e soltar, por decisão registrada.** O
 * `contrato-api.md` §8 explica: a transição pode voltar com **409
 * `TRANSICAO_CONTRARIA_COMPROMISSO`**, e aí o usuário precisa ler o que vai
 * quebrar e confirmar. Um `drop` que já aplicou não tem para onde voltar sem
 * desfazer visualmente o que o usuário acabou de ver acontecer. O `@dnd-kit`
 * entra numa segunda passada (`docs/decisoes-de-stack.md`) — e, quando
 * entrar, vai chamar o mesmo `aoMover` daqui.
 *
 * ⚠️ **A transição é livre, inclusive retrocedendo.** O contrato é explícito.
 * Por isso a lista traz os quatro outros estados, sem filtro de "só para
 * frente": uma caixa preparada para envio que voltou da sala precisa
 * retroceder, e inventar uma máquina de estados no front seria criar regra
 * que o servidor não tem.
 *
 * O componente **não** chama a API: recebe `aoMover` e devolve o estado
 * escolhido. Quem trata o 409, mostra o `DialogoDeExcecao` e reenvia com
 * `confirmar: true` é a tela — que é quem tem a mutação e o
 * `invalidarColonia` (`RF-CIC-02`).
 */
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
