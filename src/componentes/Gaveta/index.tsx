import { Drawer } from 'antd'
import type { DrawerProps } from 'antd'
import type { ReactNode } from 'react'

/**
 * Painel lateral.
 *
 * ⚠️ **Quando usar em vez do modal.** A gaveta deixa a tela de trás visível;
 * o modal a cobre. Para a ficha da posição aberta a partir da grade ou do
 * quadro, isso é o requisito: o `RF-CIC-02` diz que as duas visões nunca
 * divergem, e o técnico conferindo uma caixa precisa continuar vendo onde ela
 * está entre as vizinhas.
 *
 * Para **registrar** algo — parto, desmame, seleção — use o
 * `ModalDeFormulario`: ali cobrir a tela é bom, porque tira o que distrai de
 * um registro que não tem desfazer (`RNF-06`).
 *
 * No celular ocupa a largura toda: uma gaveta de 480px numa tela de 400
 * deixaria uma faixa inútil de fundo.
 */
export function Gaveta({
  titulo,
  aberta,
  aoFechar,
  children,
  rodape,
  largura = 480,
  ...props
}: Omit<DrawerProps, 'open' | 'onClose' | 'title' | 'footer' | 'width'> & {
  titulo: ReactNode
  aberta: boolean
  aoFechar: () => void
  children: ReactNode
  rodape?: ReactNode
  largura?: number
}) {
  return (
    <Drawer
      title={titulo}
      open={aberta}
      onClose={aoFechar}
      width={largura}
      styles={{ body: { paddingBlock: 20 } }}
      {...(rodape === undefined ? {} : { footer: rodape })}
      className="gaveta"
      destroyOnHidden
      {...props}
    >
      {children}
    </Drawer>
  )
}
