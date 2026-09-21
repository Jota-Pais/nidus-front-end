// Máscara do número do projeto de ética - RF-DEM-06, Anexo A.4

/** quantos dígitos o número tem, somando os quatro grupos */
export const DIGITOS_DO_PROJETO = 17

/** onde entra cada separador, contado em dígitos já digitados */
const SEPARADORES: ReadonlyArray<readonly [number, string]> = [
  [5, '.'],
  [11, '/'],
  [15, '-'],
]

export function somenteDigitos(entrada: string): string {
  return entrada.replace(/\D/g, '').slice(0, DIGITOS_DO_PROJETO)
}

/** Aplica a máscara ao que já foi digitado, sem completar o que falta */
export function formatarProjeto(entrada: string): string {
  const digitos = somenteDigitos(entrada)
  let saida = ''

  for (let i = 0; i < digitos.length; i += 1) {
    const separador = SEPARADORES.find(([posicao]) => posicao === i)
    if (separador) saida += separador[1]
    saida += digitos[i]
  }

  return saida
}

/** 'true' quando os 17 dígitos estão lá. Não julga o prefixo */
export function estaCompleto(entrada: string | null | undefined): boolean {
  return somenteDigitos(entrada ?? '').length === DIGITOS_DO_PROJETO
}
