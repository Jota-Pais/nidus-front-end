import { Alert } from 'antd'
import type { AlertProps } from 'antd'
import type { ReactNode } from 'react'

/** Os quatro tons de retorno, nas cores de apoio da UFSC */
export type TomDeAviso = 'informacao' | 'sucesso' | 'atencao' | 'erro'

const TIPO_ANT: Record<TomDeAviso, AlertProps['type']> = {
  informacao: 'info',
  sucesso: 'success',
  atencao: 'warning',
  erro: 'error',
}

/** Faixa de aviso na tela */
export function Aviso({
  tom = 'informacao',
  titulo,
  children,
  ...props
}: Omit<AlertProps, 'type' | 'message' | 'description' | 'children'> & {
  tom?: TomDeAviso
  titulo: ReactNode
  children?: ReactNode
}) {
  return (
    <Alert
      type={TIPO_ANT[tom] ?? 'info'}
      showIcon
      role="alert"
      message={titulo}
      {...(children === undefined ? {} : { description: children })}
      {...props}
    />
  )
}
