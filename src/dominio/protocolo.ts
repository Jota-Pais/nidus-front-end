// O número do projeto CEUA, que o pesquisador digita no pedido e o gestor cadastra no projeto.
// A CEUA da UFSC usa dois, e o campo aceita os dois:
// - o número do processo da UFSC (NUP), 23080.NNNNNN/AAAA-DD: 23080 é a UFSC, depois vêm
//   6 dígitos da sequência, 4 do ano e 2 verificadores, em módulo 11
// - o número do Sistema CEUA, de 10 dígitos, em que os 6 últimos são a data do registro (DDMMAA)
// O back-end confere a mesma regra
import { z } from 'zod'
import { hoje } from '@/lib/data'
import type { DataISO } from './tipos'

/** O código da UFSC, que abre todo número de processo dela */
const PREFIXO_DA_UFSC = '23080'

const DIGITOS = { processo: 17, sistemaCeua: 10 }

function soDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

/**
 * Durante a digitação, quem começa com 23080 está digitando o processo. Um número do Sistema
 * CEUA também pode começar assim (2308 e um dia de 01 a 09): quem desempata é o tamanho do
 * número pronto, em formatoDoNumero
 */
function pareceProcesso(digitos: string): boolean {
  return digitos.startsWith(PREFIXO_DA_UFSC)
}

function maximoDeDigitos(digitos: string): number {
  return pareceProcesso(digitos) ? DIGITOS.processo : DIGITOS.sistemaCeua
}

/**
 * O formato do número pronto, ao sair do campo ou enviar: exatamente 10 dígitos valem como
 * Sistema CEUA, mesmo começando com 23080, porque o processo tem 17
 */
function formatoDoNumero(digitos: string): keyof typeof DIGITOS {
  return digitos.length !== DIGITOS.sistemaCeua && pareceProcesso(digitos)
    ? 'processo'
    : 'sistemaCeua'
}

/** 23080.NNNNNN/AAAA-DD, com cada separador só quando já há dígito depois dele */
function pontuarProcesso(digitos: string): string {
  const trecho = (separador: string, inicio: number, fim?: number) => {
    const parte = digitos.slice(inicio, fim)
    return parte === '' ? '' : `${separador}${parte}`
  }

  return digitos.slice(0, 5) + trecho('.', 5, 11) + trecho('/', 11, 15) + trecho('-', 15)
}

/** O texto do campo durante a digitação: só os dígitos, com a pontuação do processo */
export function mascararProtocolo(texto: string): string {
  const digitos = soDigitos(texto)
  const cabem = digitos.slice(0, maximoDeDigitos(digitos))

  return pareceProcesso(cabem) ? pontuarProcesso(cabem) : cabem
}

/** A posição logo depois do n-ésimo dígito do texto; com n = 0, o começo */
function posicaoDepoisDoDigito(texto: string, n: number): number {
  return texto.match(new RegExp(`^(?:\\D*\\d){${n}}`))?.[0].length ?? texto.length
}

/**
 * Uma tecla ou uma colagem no campo. Recebe o texto como ficou e o cursor, e devolve o texto
 * com a máscara e o cursor depois do mesmo dígito em que estava, sem pular para o fim.
 * O que passa do tamanho sai do que acabou de entrar, como no maxLength do navegador: com o
 * número completo, a tecla a mais não entra, em vez de empurrar o último dígito para fora
 */
export function digitarProtocolo(texto: string, cursor: number) {
  let antes = soDigitos(texto.slice(0, cursor))
  const depois = soDigitos(texto.slice(cursor))

  while (antes !== '' && (antes + depois).length > maximoDeDigitos(antes + depois)) {
    antes = antes.slice(0, -1)
  }

  const mascarado = mascararProtocolo(antes + depois)
  return { texto: mascarado, cursor: posicaoDepoisDoDigito(mascarado, antes.length) }
}

/**
 * A forma que vai para a API e fica gravada: o processo com a pontuação e o número do Sistema
 * CEUA com os 10 dígitos limpos. Não corta dígito: o que sobra a regra recusa
 */
export function formatarProtocolo(texto: string): string {
  const digitos = soDigitos(texto)

  return formatoDoNumero(digitos) === 'processo' ? pontuarProcesso(digitos) : digitos
}

/** Módulo 11, com pesos decrescentes até 2. A conta dá de 1 a 11, e 10 e 11 viram 0 e 1 */
function digitoVerificador(digitos: string): number {
  const soma = [...digitos].reduce(
    (total, digito, i) => total + Number(digito) * (digitos.length + 1 - i),
    0,
  )
  return (11 - (soma % 11)) % 10
}

/** O primeiro verificador sai dos 15 primeiros dígitos; o segundo, dos 15 e do primeiro */
function verificadoresDoProcesso(digitos: string): string {
  const primeiro = digitoVerificador(digitos.slice(0, 15))
  const segundo = digitoVerificador(`${digitos.slice(0, 15)}${primeiro}`)
  return `${primeiro}${segundo}`
}

/** A data DDMMAA dos 6 últimos dígitos, em 'aaaa-mm-dd', ou null se ela não existe (31/02) */
function dataDoRegistro(digitos: string): DataISO | null {
  const dia = Number(digitos.slice(4, 6))
  const mes = Number(digitos.slice(6, 8))
  const data = new Date(Date.UTC(2000 + Number(digitos.slice(8, 10)), mes - 1, dia))

  return data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
    ? data.toISOString().slice(0, 10)
    : null
}

/**
 * Confere o número, com ou sem a pontuação. Devolve o que está errado, separando o número
 * incompleto do verificador ou da data errados, ou null quando o número vale
 */
export function conferirProtocolo(numero: string, diaDeHoje: DataISO = hoje()): string | null {
  const digitos = soDigitos(numero)

  if (digitos === '') return 'Informe o protocolo'

  if (formatoDoNumero(digitos) === 'processo') {
    if (digitos.length !== DIGITOS.processo) return 'O processo tem 17 dígitos'
    if (verificadoresDoProcesso(digitos) !== digitos.slice(15)) {
      return 'Dígito verificador errado: confira o número'
    }
    if (Number(digitos.slice(11, 15)) > Number(diaDeHoje.slice(0, 4))) {
      return 'O ano do processo ainda não chegou'
    }
    return null
  }

  if (digitos.length !== DIGITOS.sistemaCeua) return 'O número do Sistema CEUA tem 10 dígitos'
  // a data nos 6 últimos dígitos é conferida, mas a mensagem não explica a regra por dentro
  const registro = dataDoRegistro(digitos)
  if (registro === null || registro > diaDeHoje) return 'Protocolo CEUA no formato incorreto'
  return null
}

/** A regra do campo, sobre o número na forma em que ele vai para a API */
export const protocoloCeua = z
  .preprocess((valor) => (typeof valor === 'string' ? formatarProtocolo(valor) : valor), z.string())
  .superRefine((numero, contexto) => {
    const problema = conferirProtocolo(numero)
    if (problema !== null) contexto.addIssue({ code: 'custom', message: problema })
  })
