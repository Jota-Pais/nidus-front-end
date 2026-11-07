// O número que a estante leva na etiqueta: E-01, E-02... Quem cadastra pode trocar, porque a
// etiqueta da estante real manda

/** O número seguinte ao maior no formato E-NN, contando todas as salas. Sem nenhum, E-01 */
export function proximoNumeroDeEstante(estantes: { numeroVisivel: string }[]): string {
  const numeros = estantes
    .map((estante) => /^E-?(\d+)$/i.exec(estante.numeroVisivel.trim())?.[1])
    .filter((numero) => numero !== undefined)
    .map(Number)

  const proximo = Math.max(0, ...numeros) + 1
  return `E-${String(proximo).padStart(2, '0')}`
}
