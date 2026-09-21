import { Badge } from 'antd'
import type { ReactNode } from 'react'
import { COR, COR_DE_RETORNO } from '@/app/tokens'

/**
 * contagem sobreposta a outro elemento - alertas abertos no item de menu,
 * solicitações aguardando análise
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
