import type { ReactNode } from 'react'
import { TextoGradiente } from '../TextoGradiente'
import './estilos.css'

/**
 * Título.
 *
 * Não é o `Typography.Title` do Ant Design com outro nome: o Ant Design
 * escreve `font-weight: 600` e a família da interface no elemento, e o design
 * system pede a serifa `Calistoga` em peso normal, com entrelinha apertada e
 * tracking negativo. Fazer isso por CSS global significaria brigar com a
 * especificidade do Ant Design em toda tela.
 *
 * `realce` pinta **a última palavra** com o gradiente da marca — uma âncora
 * por título, nunca a frase inteira. ⚠️ Só a partir do nível 2: abaixo disso
 * a ponta verde do gradiente entrega 4.11:1 e reprova em AA.
 */
export function Titulo({
  children,
  nivel = 2,
  realce,
  id,
}: {
  children: ReactNode
  /** `1` só na tela de entrada. `2` é o título de tela, `3` o de seção. */
  nivel?: 1 | 2 | 3 | 4
  realce?: string
  id?: string
}) {
  const Marcacao = `h${nivel}` as const

  return (
    <Marcacao className={`titulo titulo--${nivel}`} {...(id ? { id } : {})}>
      {children}
      {realce && nivel <= 2 && (
        <>
          {' '}
          <TextoGradiente>{realce}</TextoGradiente>
        </>
      )}
      {realce && nivel > 2 && <> {realce}</>}
    </Marcacao>
  )
}
