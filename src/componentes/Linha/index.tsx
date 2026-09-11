import type { CSSProperties, ReactNode } from 'react'

/**
 * Fila horizontal que quebra quando não cabe.
 *
 * O par do `Pilha`. Substitui o `Space` e o `Flex` do Ant Design nas telas —
 * não por serem ruins, mas porque `Space` insere um `<div>` por filho, o que
 * atrapalha quando o container é `grid`, e porque `wrap` **tem** que ser o
 * padrão: no tablet da sala (`RNF-03`) uma fila que não quebra vira rolagem
 * horizontal, e rolagem horizontal em tela de trabalho é conteúdo perdido.
 */
export function Linha({
  children,
  espaco = 8,
  alinhamento = 'center',
  distribuicao,
  estilo,
}: {
  children: ReactNode
  espaco?: number
  alinhamento?: CSSProperties['alignItems']
  distribuicao?: CSSProperties['justifyContent']
  estilo?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: espaco,
        alignItems: alinhamento,
        ...(distribuicao ? { justifyContent: distribuicao } : {}),
        ...estilo,
      }}
    >
      {children}
    </div>
  )
}
