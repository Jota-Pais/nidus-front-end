// O número que a estante leva na etiqueta: E-01, E-02... Quem cadastra pode trocar, porque a
// etiqueta da estante real manda
import type { Grade } from './tipos'

/** O número seguinte ao maior no formato E-NN, contando todas as salas. Sem nenhum, E-01 */
export function proximoNumeroDeEstante(estantes: { numeroVisivel: string }[]): string {
  const numeros = estantes
    .map((estante) => /^E-?(\d+)$/i.exec(estante.numeroVisivel.trim())?.[1])
    .filter((numero) => numero !== undefined)
    .map(Number)

  const proximo = Math.max(0, ...numeros) + 1
  return `E-${String(proximo).padStart(2, '0')}`
}

/** Quantas caixas a estante tem, nas duas faces */
export function caixasNaGrade(grade: Grade): number {
  return grade.faces.reduce(
    (total, face) => total + face.posicoes.filter((posicao) => posicao.caixa !== null).length,
    0,
  )
}

/** Por que a estante não sai: "Só dá para remover a estante vazia. Esta tem 3 caixas." */
export function porQueNaoRemove(caixas: number): string {
  return `Só dá para remover a estante vazia. Esta tem ${caixas} ${caixas === 1 ? 'caixa' : 'caixas'}.`
}
