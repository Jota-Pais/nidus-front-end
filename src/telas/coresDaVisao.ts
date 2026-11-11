/**
 * Cores com significado fixo, iguais em todo gráfico: livres verde, reservados azul, machos
 * ciano, fêmeas roxo. Os números ao lado de cada marca vão em tinta de texto, nunca na cor da série
 */
export const COR = {
  livres: '#22C55E',
  reservados: '#3B82F6',
  machos: '#06B6D4',
  femeas: '#A855F7',
} as const

export const LEGENDA_SEXOS = [
  { cor: COR.machos, nome: '♂ Machos' },
  { cor: COR.femeas, nome: '♀ Fêmeas' },
]
