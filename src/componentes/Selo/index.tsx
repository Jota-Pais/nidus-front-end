import { Badge } from 'antd'
import type { ReactNode } from 'react'
import { COR, COR_DE_RETORNO } from '@/app/tokens'

/**
 * Contagem sobreposta a outro elemento — alertas abertos no item de menu,
 * solicitações aguardando análise.
 *
 * `limite` corta em "99+" por padrão: número de quatro dígitos em cima de um
 * ícone não é legível e não muda a decisão de ninguém.
 *
 * ⚠️ **Zero não vira selo.** Um "0" pendurado no menu chama atenção para a
 * ausência de trabalho, que é o contrário do que um selo serve.
 */
export function Selo({
  quantidade,
  tom = 'acento',
  limite = 99,
  children,
}: {
  quantidade: number
  tom?: 'acento' | 'erro' | 'atencao'
  limite?: number
  children?: ReactNode
}) {
  const cor =
    tom === 'erro' ? COR_DE_RETORNO.erro : tom === 'atencao' ? COR_DE_RETORNO.aviso : COR.acento

  return (
    <Badge count={quantidade} overflowCount={limite} color={cor} showZero={false}>
      {children}
    </Badge>
  )
}
