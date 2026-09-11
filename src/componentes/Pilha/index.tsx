import type { CSSProperties, ReactNode } from 'react'

/**
 * Empilhamento vertical com o espaçamento padrão da aplicação.
 *
 * Existe porque toda tela abria com o mesmo
 * `<Space direction="vertical" size={16} style={{ width: '100%' }}>` — e
 * bastava alguém esquecer o `width: 100%` para a tela inteira encolher no meio
 * da página. O espaçamento entre blocos é decisão de uma vez só.
 */
export function Pilha({
  children,
  espaco = 16,
  estilo,
}: {
  children: ReactNode
  /** `16` entre blocos da tela, `8` dentro de um bloco. */
  espaco?: number
  estilo?: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: espaco, width: '100%', ...estilo }}>
      {children}
    </div>
  )
}
