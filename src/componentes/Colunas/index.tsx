import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Colunas que viram uma só no celular.
 *
 * Substitui o par `Row`/`Col` do Ant Design, que exige contar 24 avos em cada
 * filho e repetir `xs={24} md={12}` em todos. Aqui a tela diz quantas colunas
 * quer e o empilhamento no estreito é automático — que é a regra do design
 * system e também a do `RNF-03`.
 *
 * `minimo` é o que decide de verdade: abaixo dessa largura a coluna quebra,
 * mesmo que sobre espaço para o número pedido. Uma tabela espremida em 180px
 * não é uma coluna, é um acidente.
 */
export function Colunas({
  children,
  quantidade = 2,
  minimo = 280,
  espaco = 16,
}: {
  children: ReactNode
  quantidade?: number
  /** Largura mínima de cada coluna, em px. Abaixo disso, empilha. */
  minimo?: number
  espaco?: number
}) {
  return (
    <div
      className="colunas"
      style={{
        gap: espaco,
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minimo}px, 100%), 1fr))`,
        maxWidth: `calc(${quantidade} * 100%)`,
      }}
    >
      {children}
    </div>
  )
}
