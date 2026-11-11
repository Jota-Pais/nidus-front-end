import { GRAFICO } from '@/app/tokens'

/**
 * Cores com significado fixo, iguais em todo gráfico: livres verde, reservados azul, machos
 * ciano, fêmeas roxo. Os números ao lado de cada marca vão em tinta de texto, nunca na cor da série
 */
export const COR = GRAFICO

export const LEGENDA_SEXOS = [
  { cor: COR.machos, nome: '♂ Machos' },
  { cor: COR.femeas, nome: '♀ Fêmeas' },
]
