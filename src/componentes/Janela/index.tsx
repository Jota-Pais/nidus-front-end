import { Modal } from 'antd'
import type { ModalProps } from 'antd'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import './estilos.css'

/**
 * A janela do Nidus. No computador é o Modal do antd, com as props de sempre. No celular vira
 * tela cheia: o título fica preso em cima, o rodapé com as ações preso embaixo, ao alcance do
 * polegar, e o conteúdo rola entre os dois. A largura pedida vale só no computador
 */
export function Janela(props: ModalProps) {
  const estreita = useTelaEstreita()

  if (!estreita) return <Modal {...props} />

  const { rootClassName, style, styles, ...resto } = props

  return (
    <Modal
      {...resto}
      width="100%"
      centered={false}
      rootClassName={['janela--cheia', rootClassName].filter(Boolean).join(' ')}
      style={{ ...style, top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 }}
      styles={{
        ...styles,
        // quem chama pode pintar o título (a ficha pinta na cor do parto); o espaço em volta é da
        // tela cheia, que ocupa a largura toda e deixa lugar para o X
        header: {
          ...styles?.header,
          margin: 0,
          padding: 'calc(12px + env(safe-area-inset-top)) 60px 12px 16px',
        },
      }}
    />
  )
}
