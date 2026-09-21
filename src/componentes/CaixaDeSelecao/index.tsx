import { Checkbox } from 'antd'
import type { CheckboxProps } from 'antd'
import type { ReactNode } from 'react'

/** Marcação de "sim/não" dentro de formulário */
export const CaixaDeSelecao = Object.assign(
  function CaixaDeSelecao({ children, ...props }: CheckboxProps & { children: ReactNode }) {
    return <Checkbox {...props}>{children}</Checkbox>
  },
  {
    Grupo: Checkbox.Group,
  },
)
