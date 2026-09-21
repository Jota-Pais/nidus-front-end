import type { CSSProperties, ReactNode } from 'react'

/** Empilhamento vertical com o espaçamento padrão da aplicação */
export function Pilha({
  children,
  espaco = 16,
  estilo,
}: {
  children: ReactNode
  /** 16 entre blocos da tela, 8 dentro de um bloco. */
  espaco?: number
  estilo?: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: espaco, width: '100%', ...estilo }}>
      {children}
    </div>
  )
}
