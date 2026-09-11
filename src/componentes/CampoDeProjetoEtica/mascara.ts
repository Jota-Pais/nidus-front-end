/**
 * Máscara do número do projeto de ética — `RF-DEM-06`, Anexo A.4.
 *
 * Forma: `23080.XXXXXX/AAAA-XX` — 17 dígitos em quatro grupos.
 *
 * ⚠️ **A máscara é posicional, não literal.** O prefixo `23080` é o código da
 * UFSC, e o Anexo A deixa em aberto se o sistema precisa aceitar outro:
 * pesquisador com projeto de instituição parceira é caso plausível. Se a
 * máscara chumbasse `23080`, o dia em que o cliente responder "aceita outros"
 * seria um dia de reescrever o campo. Aqui ela só conta dígito e põe
 * separador; quem cobra o prefixo é `REGEX_PROJETO_ETICA`, e cobrar de
 * verdade é do servidor (`RNF-01`).
 */

/** Quantos dígitos o número tem, somando os quatro grupos. */
export const DIGITOS_DO_PROJETO = 17

/** Onde entra cada separador, contado em dígitos já digitados. */
const SEPARADORES: ReadonlyArray<readonly [number, string]> = [
  [5, '.'],
  [11, '/'],
  [15, '-'],
]

export function somenteDigitos(entrada: string): string {
  return entrada.replace(/\D/g, '').slice(0, DIGITOS_DO_PROJETO)
}

/**
 * Aplica a máscara ao que já foi digitado, sem completar o que falta.
 *
 * Digitação parcial devolve máscara parcial (`'23080.12'`), e não o gabarito
 * com buracos: campo que se preenche sozinho de `_` faz o cursor pular e o
 * usuário digitar por cima do próprio texto.
 */
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

/** `true` quando os 17 dígitos estão lá. Não julga o prefixo. */
export function estaCompleto(entrada: string | null | undefined): boolean {
  return somenteDigitos(entrada ?? '').length === DIGITOS_DO_PROJETO
}
