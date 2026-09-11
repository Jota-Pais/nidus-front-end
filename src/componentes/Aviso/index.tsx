import { Alert } from 'antd'
import type { AlertProps } from 'antd'
import type { ReactNode } from 'react'

/** Os quatro tons de retorno, nas cores de apoio da UFSC. */
export type TomDeAviso = 'informacao' | 'sucesso' | 'atencao' | 'erro'

const TIPO_ANT: Record<TomDeAviso, AlertProps['type']> = {
  informacao: 'info',
  sucesso: 'success',
  atencao: 'warning',
  erro: 'error',
}

/**
 * Faixa de aviso na tela.
 *
 * ⚠️ **`role="alert"` sempre.** O `RNF-10` pede que o leitor de tela anuncie
 * o aviso assim que ele aparece, sem o usuário ter que sair procurando. Era o
 * que faltava no `Alert` cru e o que fazia cada tela lembrar (ou esquecer) de
 * pôr à mão.
 *
 * ⚠️ **Vermelho só para falha de verdade.** O 409 do contrato é regra de
 * negócio — o sistema funcionou e recusou — e vai como `atencao`. Quem trata
 * isso sozinho é o `MensagemDeErro`; use este componente para aviso que a
 * tela decide mostrar, não para erro de requisição.
 */
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
