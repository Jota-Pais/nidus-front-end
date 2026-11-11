import type { IdadeNaVisaoGeral } from './tipos'

/** Mais idades distintas que isso e o gráfico agrupa por semana, para as barras caberem no cartão */
export const MAX_IDADES_SEM_AGRUPAR = 8

export interface GrupoDeIdade {
  /** o rótulo do eixo: "38 d" ou "7–13 d" */
  rotulo: string
  /** o do tooltip: "38 dias" ou "7–13 dias" */
  nome: string
  m: number
  f: number
}

const nomeDoPlural = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural)

/**
 * Um grupo por idade em dias; com mais de 8 idades distintas, um grupo por semana ("0–6 d",
 * "7–13 d"…), com os machos e as fêmeas somados. A entrada é a da API, crescente
 */
export function agruparPorIdade(idades: IdadeNaVisaoGeral[]): GrupoDeIdade[] {
  if (idades.length <= MAX_IDADES_SEM_AGRUPAR) {
    return idades.map(({ idade, m, f }) => ({
      rotulo: `${idade} d`,
      nome: `${idade} ${nomeDoPlural(idade, 'dia', 'dias')}`,
      m,
      f,
    }))
  }

  const semanas = new Map<number, GrupoDeIdade>()
  for (const { idade, m, f } of idades) {
    const semana = Math.floor(idade / 7)
    const atual = semanas.get(semana)
    if (atual) {
      atual.m += m
      atual.f += f
    } else {
      const faixa = `${semana * 7}–${semana * 7 + 6}`
      semanas.set(semana, { rotulo: `${faixa} d`, nome: `${faixa} dias`, m, f })
    }
  }
  return [...semanas.entries()].sort(([a], [b]) => a - b).map(([, grupo]) => grupo)
}

/** "5 machos, 4 fêmeas" */
export function frasePorSexo({ m, f }: { m: number; f: number }): string {
  return `${m} ${nomeDoPlural(m, 'macho', 'machos')}, ${f} ${nomeDoPlural(f, 'fêmea', 'fêmeas')}`
}
