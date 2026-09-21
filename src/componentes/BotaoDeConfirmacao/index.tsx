import { Popconfirm } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import { Botao } from '../Botao'
import type { VarianteDeBotao } from '../Botao'

/** botão que pergunta antes */
export function BotaoDeConfirmacao({
  pergunta,
  detalhe,
  aoConfirmar,
  children,
  rotuloConfirmar = 'Confirmar',
  variante = 'secundario',
  carregando = false,
  ...resto
}: Omit<ButtonProps, 'onClick' | 'danger' | 'loading' | 'type'> & {
  /** A consequência, em uma frase. ex: "O casal AB deixa de reproduzir." */
  pergunta: ReactNode
  detalhe?: ReactNode
  aoConfirmar: () => void
  children: ReactNode
  rotuloConfirmar?: string
  variante?: VarianteDeBotao
  carregando?: boolean
}) {
  return (
    <Popconfirm
      title={pergunta}
      {...(detalhe === undefined ? {} : { description: detalhe })}
      onConfirm={aoConfirmar}
      okText={rotuloConfirmar}
      cancelText="Cancelar"
      okButtonProps={{ danger: variante === 'perigo', loading: carregando }}
    >
      <Botao variante={variante} loading={carregando} {...resto}>
        {children}
      </Botao>
    </Popconfirm>
  )
}
