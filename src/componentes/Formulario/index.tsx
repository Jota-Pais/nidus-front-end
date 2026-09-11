import { Form } from 'antd'
import type { FormItemProps, FormProps } from 'antd'
import type { ReactNode } from 'react'

/**
 * Formulário.
 *
 * Três padrões da equipe, aplicados de uma vez:
 *
 * - **`layout="vertical"`.** Rótulo em cima do campo. Rótulo ao lado obriga a
 *   uma coluna fixa que não cabe no tablet da sala (`RNF-03`) e quebra feio
 *   quando o texto do rótulo é longo.
 * - **`requiredMark={false}`.** O asterisco de obrigatório é ruído quando
 *   quase todo campo é obrigatório, que é o caso dos registros do técnico. O
 *   que é opcional, o `Campo` marca por escrito.
 * - **`scrollToFirstError`.** Formulário longo que recusa o envio sem levar o
 *   olho até o campo errado faz o usuário achar que o botão quebrou.
 */
export function Formulario<V extends object>({
  children,
  ...props
}: Omit<FormProps<V>, 'children'> & { children?: ReactNode }) {
  /*
   * `children` é declarado como `ReactNode`, e não como o `children` do
   * `FormProps`. O `Form` do Ant Design aceita função como filho, mas a
   * assinatura dele intersecta isso com `PropsWithChildren` e, sob
   * `exactOptionalPropertyTypes`, as duas formas não se encontram.
   *
   * A forma de função não é usada em lugar nenhum do projeto — quem precisa
   * reagir a mudança de campo usa `Formulario.observar`, que é mais legível.
   * Então o tipo diz o que a equipe de fato escreve.
   */
  return (
    <Form layout="vertical" requiredMark={false} scrollToFirstError {...(props as FormProps)}>
      {children}
    </Form>
  )
}

/**
 * Um campo do formulário.
 *
 * `opcional` escreve "(opcional)" no rótulo, que é a contrapartida de ter
 * tirado o asterisco: sem uma das duas marcas, o usuário não tem como saber
 * o que pode deixar em branco antes de apanhar do servidor.
 *
 * `ajuda` é para o que o campo **não** consegue dizer sozinho — a base da
 * idade enquanto `CONF-01` não fecha, ou que a data prevista é recalculada
 * pelo servidor. Não é para repetir o rótulo com outras palavras.
 *
 * ⚠️ As `rules` daqui são **formato**, nunca regra de negócio (`RNF-01`):
 * obrigatório, número não negativo, data válida. Viabilidade de prazo,
 * cota e par genético são do servidor, e voltam pelo `erro.campos` que o
 * `ModalDeFormulario` já encaminha para o campo certo.
 */
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
