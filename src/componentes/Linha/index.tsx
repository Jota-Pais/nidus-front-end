import type { CSSProperties, ReactNode } from 'react'

/** fila horizontal que quebra quando não cabe. */
export function Linha({
  children,
  espaco = 8,
  distribuicao,
  estilo,
}: {
  children: ReactNode
  espaco?: number
  distribuicao?: CSSProperties['justifyContent']
  estilo?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: espaco,
        alignItems: 'center',
        ...(distribuicao ? { justifyContent: distribuicao } : {}),
        ...estilo,
      }}
    >
      {children}
    </div>
  )
}
