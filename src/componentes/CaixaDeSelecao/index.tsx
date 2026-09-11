import { Checkbox } from 'antd'
import type { CheckboxProps } from 'antd'
import type { ReactNode } from 'react'

/**
 * Marcação de "sim/não" dentro de formulário.
 *
 * Diferente do `Interruptor`: aqui a escolha só vale quando o formulário é
 * enviado. É o controle certo para confirmação de leitura, opção de envio e
 * qualquer coisa que entre no corpo de um `POST`.
 *
 * `Grupo` serve à escolha múltipla — filtro por finalidade de caixa, por
 * exemplo. Empilhado, não em linha: alvo de toque de luva (`RNF-03`) precisa
 * de espaço entre um e outro, e em linha eles encostam.
 */
export const CaixaDeSelecao = Object.assign(
  function CaixaDeSelecao({ children, ...props }: CheckboxProps & { children: ReactNode }) {
    return <Checkbox {...props}>{children}</Checkbox>
  },
  {
    Grupo: Checkbox.Group,
  },
)
