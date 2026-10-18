import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import { forwardRef } from 'react'

/** Campo de texto */
export const Entrada = Object.assign(
  forwardRef<InputRef, InputProps>(function Entrada(props, ref) {
    return <Input ref={ref} {...props} />
  }),
  {
    /** Com o olho de mostrar/esconder */
    Senha: Input.Password,
  },
)
