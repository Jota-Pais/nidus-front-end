import { Form } from 'antd'
import type { FormItemProps, FormProps } from 'antd'
import type { ReactNode } from 'react'

/** Formulário */
export function Formulario<V extends object>({
  children,
  ...props
}: Omit<FormProps<V>, 'children'> & { children?: ReactNode }) {
  // children é declarado como ReactNode, e não como o children do
  // 'FormProps'. O 'Form' do Ant Design aceita função como filho, mas a
  // assinatura dele intersecta isso com PropsWithChildren e, sob
  // exactOptionalPropertyTypes, as duas formas não se encontram
  return (
    <Form layout="vertical" requiredMark={false} scrollToFirstError {...(props as FormProps)}>
      {children}
    </Form>
  )
}

/** Um campo do formulário. */
export function Campo({
  rotulo,
  opcional = false,
  ajuda,
  children,
  ...props
}: Omit<FormItemProps, 'label' | 'extra'> & {
  rotulo: ReactNode
  opcional?: boolean
  ajuda?: ReactNode
  children: ReactNode
}) {
  return (
    <Form.Item
      label={
        opcional ? (
          <>
            {rotulo} <span style={{ color: 'var(--cor-suave-frente)' }}>(opcional)</span>
          </>
        ) : (
          rotulo
        )
      }
      {...(ajuda === undefined ? {} : { extra: ajuda })}
      {...props}
    >
      {children}
    </Form.Item>
  )
}

Formulario.Campo = Campo
Formulario.Lista = Form.List
Formulario.usarInstancia = Form.useForm
Formulario.observar = Form.useWatch
