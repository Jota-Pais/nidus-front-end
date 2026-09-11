/**
 * O valor do `CampoPorSexo` enquanto está sendo preenchido.
 *
 * Mora fora do componente pelo mesmo motivo que `mascara.ts` mora fora do
 * `CampoDeProjetoEtica`: arquivo que exporta componente **e** função solta
 * quebra o hot reload do React (`react-refresh/only-export-components`), e
 * função pura sem JSX é o que se consegue testar sem montar nada.
 */
import type { PorSexo } from '@/dominio/tipos'

/**
 * ⚠️ `null` é **campo em branco**, e não zero.
 *
 * "Nasceram 0 machos" é uma resposta possível e diferente de "ainda não
 * respondi". Confundir as duas é como se grava ninhada zerada por engano — e
 * o `RNF-06` não deixa apagar, então a correção vira mais um registro.
 */
export interface ValorPorSexo {
  m: number | null
  f: number | null
}

export const VAZIO: ValorPorSexo = { m: null, f: null }

/** `true` quando as duas pontas foram respondidas. Para a regra do `Form.Item`. */
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

/** Converte para a forma do contrato, ou `null` se ainda falta metade. */
export function paraPorSexo(valor: ValorPorSexo | null | undefined): PorSexo | null {
  if (!estaCompleto(valor)) return null
  return { m: valor!.m as number, f: valor!.f as number }
}

/**
 * Soma as duas pontas.
 *
 * ⚠️ **Existe para caber num rótulo, e nada mais.** Uma caixa com 4 machos e
 * 6 fêmeas **não** atende um pedido de 5 machos, e "10 animais" faz parecer
 * que atende: o pesquisador pede por sexo e o motor atende por sexo
 * (`RN-09`). Nunca usar este total para decidir alguma coisa — e decidir,
 * de todo jeito, é do servidor (`RNF-01`).
 */
export function total(valor: PorSexo): number {
  return valor.m + valor.f
}
