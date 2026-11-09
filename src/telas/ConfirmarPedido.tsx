import { Modal } from 'antd'
import { Aviso } from '@/componentes'
import type { Viabilidade } from '@/dominio/tipos'
import { confirmacaoDoPedido } from './confirmacaoDoPedido'

/** A confirmação do envio, com o veredito da viabilidade. 'null' é a conferência que falhou */
export function ConfirmarPedido({
  viabilidade,
  enviando,
  aoEnviar,
  aoVoltar,
}: {
  viabilidade: Viabilidade | null
  enviando: boolean
  aoEnviar: () => void
  aoVoltar: () => void
}) {
  const { tom, titulo, detalhe, enviar, voltar } = confirmacaoDoPedido(viabilidade)

  return (
    <Modal
      open
      title="Enviar pedido"
      okText={enviar}
      okButtonProps={{ danger: tom === 'erro' }}
      cancelText={voltar}
      onOk={aoEnviar}
      onCancel={aoVoltar}
      confirmLoading={enviando}
    >
      <Aviso tom={tom} titulo={titulo}>
        {detalhe}
      </Aviso>
    </Modal>
  )
}
