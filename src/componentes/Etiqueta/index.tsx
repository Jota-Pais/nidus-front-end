import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Os tons da paleta institucional. `neutro` é o padrão — etiqueta colorida
 * demais deixa de marcar coisa nenhuma.
 */
export type TomDeEtiqueta = 'neutro' | 'acento' | 'institucional' | 'sucesso' | 'atencao' | 'erro'

/**
 * Etiqueta.
 *
 * Não usa o `Tag` do Ant Design com `color="blue"`: as cores predefinidas
 * dele (`blue`, `gold`, `volcano`, `purple`) são de outra paleta e, ao lado
 * do azul e do verde da UFSC, parecem borrão de outro sistema. Os tons aqui
 * saem dos tokens.
 *
 * Cada tom usa a **variante escurecida** da cor institucional para o texto —
 * o Verde Bandeira e o Vermelho Tomate crus entregam 3.9:1 e reprovam em AA
 * (`RNF-10`). A superfície fica clara e o texto escuro, e aí passa.
 *
 * ⚠️ **A cor da etiqueta nunca é a única informação.** Onde ela marca estado
 * de caixa ou grau de certeza, quem carrega o dado é o marcador e a sigla de
 * `@/dominio/estados` — use `EtiquetaDeEstado`, que já monta os três canais.
 */
export function Etiqueta({
  children,
  tom = 'neutro',
  contorno = false,
  title,
}: {
  children: ReactNode
  tom?: TomDeEtiqueta
  /** Só o contorno, sem preenchimento. Para etiqueta que se repete em lista. */
  contorno?: boolean
  title?: string
}) {
  return (
    <span
      className={`etiqueta etiqueta--${tom}${contorno ? ' etiqueta--contorno' : ''}`}
      {...(title ? { title } : {})}
    >
      {children}
    </span>
  )
}
