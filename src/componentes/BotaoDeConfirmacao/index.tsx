import { Popconfirm } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import { Botao } from '../Botao'
import type { VarianteDeBotao } from '../Botao'

/**
 * Botão que pergunta antes.
 *
 * Para ação que **não tem desfazer na interface**: encerrar casal
 * (`RF-REP-08`), registrar eutanásia de seleção (`RF-REP-04`), mover caixa
 * quebrando compromisso (`RF-CIC-03`).
 *
 * ⚠️ **Nada aqui apaga nada** (`RNF-06`): o encerramento é um registro novo, o
 * casal continua no banco. A confirmação existe porque o registro é um fato do
 * mundo real — o animal foi eutanasiado, o casal foi desfeito — e desfazer é
 * outro registro, não um `Ctrl+Z`.
 *
 * A pergunta é uma frase com a consequência, não "Tem certeza?": quem lê "Tem
 * certeza?" pela décima vez no turno clica em "Sim" sem ler.
 */
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
  /** A consequência, em uma frase. Ex.: "O casal AB deixa de reproduzir." */
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
