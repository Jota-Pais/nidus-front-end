// O formato da estante: quantas faces, linhas e colunas ela tem. Dele sai o código de cada posição,
// o mesmo da etiqueta da estante real: a face (F frontal, T traseira), a linha e a letra da coluna.
// A traseira continua as letras da frontal: com 8 colunas, a frontal vai de A a H e a traseira de I
// a P; com 9, a traseira vai de J a R. Por isso mudar as colunas muda a letra da traseira
import type { Face, Formato, Grade } from './tipos'

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Faces × colunas não passa disto: cada coluna de cada face precisa de uma letra */
export const MAXIMO_DE_LETRAS = ALFABETO.length

/** A recusa das medidas que não cabem no alfabeto, com as palavras da API */
export const MENSAGEM_DAS_LETRAS = `Faces x colunas não pode passar de ${MAXIMO_DE_LETRAS} - o endereço ficaria sem letra.`

/** Linhas e colunas vão de 1 a 26, como na API */
export const MAIOR_MEDIDA = 26

/** As medidas que desenham a estante: as do formato, que a estante copia */
export interface Medidas {
  faces: number
  linhas: number
  colunas: number
}

/** O que um campo de número do formulário guarda: vazio é null ou undefined */
type Numero = number | null | undefined

/** As faces da estante, na ordem: a frontal, e a traseira quando são duas */
export function facesDa(faces: number): Face[] {
  return faces === 2 ? ['frontal', 'traseira'] : ['frontal']
}

const inteiroAte = (valor: Numero, maximo: number): valor is number =>
  typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= maximo

/**
 * As medidas do formulário, quando dá para desenhar a estante com elas: 1 ou 2 faces, linhas e
 * colunas de 1 a 26 e uma letra para cada coluna. Senão, null
 */
export function medidasQueCabem(faces: Numero, linhas: Numero, colunas: Numero): Medidas | null {
  if (
    !inteiroAte(faces, 2) ||
    !inteiroAte(linhas, MAIOR_MEDIDA) ||
    !inteiroAte(colunas, MAIOR_MEDIDA)
  )
    return null
  return faces * colunas <= MAXIMO_DE_LETRAS ? { faces, linhas, colunas } : null
}

/** "F1A": a face, a linha e a letra da coluna, que em cada face conta de 1 */
export function codigoDaPosicao(
  face: Face,
  linha: number,
  coluna: number,
  colunas: number,
): string {
  const letra = ALFABETO[(face === 'frontal' ? 0 : colunas) + coluna - 1]
  return `${face === 'frontal' ? 'F' : 'T'}${linha}${letra ?? '?'}`
}

/** "2 faces de 8 × 8 (128 caixas)", "1 face de 5 × 4 (20 caixas)" */
export function descreverMedidas({ faces, linhas, colunas }: Medidas): string {
  const caixas = faces * linhas * colunas
  return `${faces} ${faces === 1 ? 'face' : 'faces'} de ${linhas} × ${colunas} (${caixas} ${caixas === 1 ? 'caixa' : 'caixas'})`
}

/** O formato na escolha da estante: "ALESCO Modelo 1 · 2 faces de 8 × 8 (128 caixas)" */
export function descreverFormato(formato: Pick<Formato, 'nome'> & Medidas): string {
  return `${formato.nome} · ${descreverMedidas(formato)}`
}

/** "E-01", "E-01 e E-06", "E-01, E-03 e E-06" */
function emLista(itens: readonly string[]): string {
  const ultimo = itens.at(-1)
  if (itens.length < 2 || ultimo === undefined) return ultimo ?? ''
  return `${itens.slice(0, -1).join(', ')} e ${ultimo}`
}

/** "Usado por E-01 e E-06": por que o formato não sai da lista */
export function usadoPor(formato: Pick<Formato, 'estantes'>): string {
  return `Usado por ${emLista(formato.estantes.map((estante) => estante.numeroVisivel))}`
}

/**
 * Quem muda junto com o formato: "Usado pelas estantes E-01 (Sala 1) e E-06 (Sala 2): mudar faces,
 * linhas ou colunas muda essas estantes também." Null no formato que nenhuma estante usa
 */
export function avisoDoUso(formato: Pick<Formato, 'estantes'>): string | null {
  const { estantes } = formato
  if (estantes.length === 0) return null

  const quais = emLista(estantes.map((estante) => `${estante.numeroVisivel} (${estante.sala})`))
  return estantes.length === 1
    ? `Usado pela estante ${quais}: mudar faces, linhas ou colunas muda essa estante também.`
    : `Usado pelas estantes ${quais}: mudar faces, linhas ou colunas muda essas estantes também.`
}

/**
 * As caixas que ficariam fora das medidas: numa face, linha ou coluna que o formato não tem. Os
 * códigos são os de agora, da frontal para a traseira e linha por linha
 */
export function caixasForaDoFormato(grade: Grade, medidas: Medidas): string[] {
  const faces = facesDa(medidas.faces)

  return grade.faces.flatMap(({ face, posicoes }) =>
    [...posicoes]
      .sort((a, b) => a.linha - b.linha || a.coluna - b.coluna)
      .filter(
        (posicao) =>
          posicao.caixa !== null &&
          (!faces.includes(face) ||
            posicao.linha > medidas.linhas ||
            posicao.coluna > medidas.colunas),
      )
      .map((posicao) => posicao.codigo),
  )
}

/** "As caixas F8A e T8C ficam fora deste formato. Mude-as de lugar antes de trocar." */
export function avisoDasCaixasFora(codigos: readonly string[]): string {
  return codigos.length === 1
    ? `A caixa ${emLista(codigos)} fica fora deste formato. Mude-a de lugar antes de trocar.`
    : `As caixas ${emLista(codigos)} ficam fora deste formato. Mude-as de lugar antes de trocar.`
}

/**
 * Com duas faces antes e depois e outro número de colunas, a traseira troca de letras: "Com 9
 * colunas, as letras da face traseira mudam: T1I passa a T1J." Null quando as letras ficam. Com uma
 * face antes não havia traseira, e não há letra que mude
 */
export function avisoDaTraseira(antes: Medidas, depois: Medidas): string | null {
  if (antes.faces !== 2 || depois.faces !== 2 || antes.colunas === depois.colunas) return null

  const colunas = `${depois.colunas} ${depois.colunas === 1 ? 'coluna' : 'colunas'}`
  const de = codigoDaPosicao('traseira', 1, 1, antes.colunas)
  const para = codigoDaPosicao('traseira', 1, 1, depois.colunas)
  return `Com ${colunas}, as letras da face traseira mudam: ${de} passa a ${para}.`
}
