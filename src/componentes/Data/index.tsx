import type { DataISO } from '@/dominio/tipos'
import { formatarData } from '@/lib/data'
import './estilos.css'

/** Uma data na tela - RNF-04. */
export function Data({ valor }: { valor: DataISO | null | undefined }) {
  const texto = formatarData(valor)
  if (!valor) return <span className="data data--ausente">{texto}</span>
  return (
    <time className="data" dateTime={valor}>
      {texto}
    </time>
  )
}
