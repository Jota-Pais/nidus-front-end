import { App } from 'antd'
import { useMoverCaixa } from '@/dominio/consultas'
import type { EstadoCaixa } from '@/dominio/tipos'
import { ErroDeApi } from '@/lib/api'

/**
 * Muda a caixa de coluna, pelo kanban (arrastando) ou pela ficha (status). Se a caixa tem
 * animais comprometidos o servidor recusa com 409, e aí só passa se o técnico confirmar.
 * 'aoTerminar' roda no fim, deu certo ou não
 */
export function useMudarDeColuna() {
  const { modal, message } = App.useApp()
  const mover = useMoverCaixa()

  return function mudar(idCaixa: number, estado: EstadoCaixa, aoTerminar: () => void = () => {}) {
    const enviar = async (confirmar: boolean) => {
      try {
        await mover.mutateAsync({ idCaixa, estado, confirmar })
        aoTerminar()
      } catch (erro) {
        if (erro instanceof ErroDeApi && erro.ehRegraDeNegocio && !confirmar) {
          modal.confirm({
            title: 'Esta caixa tem animais comprometidos',
            content: erro.message,
            okText: 'Mover mesmo assim',
            cancelText: 'Cancelar',
            onOk: () => enviar(true),
            onCancel: aoTerminar,
          })
          return
        }
        aoTerminar()
        void message.error((erro as Error).message)
      }
    }

    void enviar(false)
  }
}
