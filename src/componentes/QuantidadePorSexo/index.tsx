import type { PorSexo } from '@/dominio/tipos'
import './estilos.css'

/**
 * Contagem macho/fêmea - a forma em que o contrato conta animal em todo lugar: nascido,
 * eutanasiado, desmamado, disponível, comprometido, pedido
 */
export function QuantidadePorSexo({
  valor,
  discreto = false,
}: {
  valor: PorSexo | null | undefined
  /** Sem as caixinhas, para dentro de tabela densa */
  discreto?: boolean
}) {
  if (!valor) return <span className="quantidadePorSexo__vazia">—</span>

  const porExtenso = `${valor.m} ${valor.m === 1 ? 'macho' : 'machos'} e ${valor.f} ${
    valor.f === 1 ? 'fêmea' : 'fêmeas'
  }`

  return (
    <span
      className={`quantidadePorSexo${discreto ? ' quantidadePorSexo--discreto' : ''}`}
      aria-label={porExtenso}
    >
      <span className="quantidadePorSexo__parte" aria-hidden="true">
        <b>{valor.m}</b> M
      </span>
      <span className="quantidadePorSexo__separador" aria-hidden="true">
        ·
      </span>
      <span className="quantidadePorSexo__parte" aria-hidden="true">
        <b>{valor.f}</b> F
      </span>
    </span>
  )
}
