import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import './estilos.css'

/**
 * As variantes de botão do design system.
 *
 * `primario` é o gradiente-assinatura e **só existe um por tela** — é a ação
 * que a tela existe para fazer. Se duas coisas são primárias, nenhuma é.
 */
export type VarianteDeBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const TIPO_ANT: Record<VarianteDeBotao, ButtonProps['type']> = {
  primario: 'primary',
  secundario: 'default',
  fantasma: 'text',
  perigo: 'primary',
}

/**
 * Botão.
 *
 * Por cima do `Button` do Ant Design, não no lugar dele: `loading`, `disabled`,
 * `htmlType="submit"` e o comportamento de foco já estão certos lá, e
 * reescrever isso à mão é como se perde acessibilidade sem perceber.
 *
 * O que o design system acrescenta, e mora no CSS ao lado:
 *
 * - **gradiente** no primário, em vez de cor chapada;
 * - **subida de 2px no hover**, com a sombra tingida de acento — a impressão
 *   é de que o botão está mais alto que o resto da tela;
 * - **encolhimento no clique** (`scale(.98)`), que é o retorno tátil que falta
 *   num alvo de 48px;
 * - **seta que anda** para a direita quando o botão leva a algum lugar.
 *
 * ⚠️ **48px de altura não é estética** (`RNF-03`): o técnico opera de luvas,
 * dentro da sala. Vem de `ALTURA_DE_CONTROLE`, pelo tema — não sobrescrever
 * com `size="small"` em tela de registro.
 */
export function Botao({
  variante = 'secundario',
  comSeta = false,
  children,
  className,
  ...resto
}: Omit<ButtonProps, 'type' | 'danger'> & {
  variante?: VarianteDeBotao
  /** Para ação que leva a outro lugar. A seta anda no hover. */
  comSeta?: boolean
  children?: ReactNode
}) {
  return (
    <Button
      type={TIPO_ANT[variante] ?? 'default'}
      danger={variante === 'perigo'}
      className={['botao', `botao--${variante}`, className].filter(Boolean).join(' ')}
      {...resto}
    >
      {children}
      {comSeta && (
        <span className="botao__seta" aria-hidden="true">
          →
        </span>
      )}
    </Button>
  )
}
