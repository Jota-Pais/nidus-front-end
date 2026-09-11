import type { DataISO } from '@/dominio/tipos'
import { formatarData } from '@/lib/data'
import './estilos.css'

/**
 * Uma data na tela — `RNF-04`.
 *
 * "Exibição sempre em `dd/mm/aaaa`." Nenhuma tela chama `formatarData` na
 * mão e nenhuma escreve `toLocaleDateString`: o formato mora em
 * `@/lib/data`, e este componente é o único caminho até a tela.
 *
 * Sai em `<time dateTime>` com o valor ISO: a data legível fica para o
 * humano, a máquina continua tendo a não ambígua. E em monoespaçada com
 * `tabular-nums`, porque data em coluna de tabela precisa alinhar o dia
 * embaixo do dia.
 *
 * Data ausente vira travessão, nunca `Invalid Date`.
 */
export function Data({ valor }: { valor: DataISO | null | undefined }) {
  const texto = formatarData(valor)
  if (!valor) return <span className="data data--ausente">{texto}</span>
  return (
    <time className="data" dateTime={valor}>
      {texto}
    </time>
  )
}
