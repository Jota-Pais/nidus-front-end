// O valor do 'CampoPorSexo' enquanto está sendo preenchido
import type { PorSexo } from '@/dominio/tipos'

/** null é campo em branco, e não zero. */
export interface ValorPorSexo {
  m: number | null
  f: number | null
}

export const VAZIO: ValorPorSexo = { m: null, f: null }

/** 'true' quando as duas pontas foram respondidas. Para a regra do 'Form.Item' */
export function estaCompleto(valor: ValorPorSexo | null | undefined): boolean {
  return (
    valor !== null &&
    valor !== undefined &&
    valor.m !== null &&
    valor.m !== undefined &&
    valor.f !== null &&
    valor.f !== undefined
  )
}

/** converte para a forma do contrato, ou null se ainda falta metade */
export function paraPorSexo(valor: ValorPorSexo | null | undefined): PorSexo | null {
  if (!estaCompleto(valor)) return null
  return { m: valor!.m as number, f: valor!.f as number }
}

/** Soma as duas pontas */
export function total(valor: PorSexo): number {
  return valor.m + valor.f
}
