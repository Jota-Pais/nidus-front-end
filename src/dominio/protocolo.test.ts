import { describe, expect, it } from 'vitest'
import {
  conferirProtocolo,
  digitarProtocolo,
  formatarProtocolo,
  mascararProtocolo,
  protocoloCeua,
} from './protocolo'

const HOJE = '2026-11-05'

describe('mascararProtocolo', () => {
  it('põe a pontuação do processo à medida que os dígitos chegam', () => {
    expect(mascararProtocolo('23080')).toBe('23080')
    expect(mascararProtocolo('230800')).toBe('23080.0')
    expect(mascararProtocolo('230800123452')).toBe('23080.012345/2')
    expect(mascararProtocolo('2308001234520261')).toBe('23080.012345/2026-1')
  })

  it('ignora a pontuação digitada ou colada e recoloca a dela', () => {
    expect(mascararProtocolo('23080 012345-2026/14')).toBe('23080.012345/2026-14')
    expect(mascararProtocolo('3106.240.920')).toBe('3106240920')
  })

  it('não deixa passar do tamanho: 17 dígitos no processo, 10 no Sistema CEUA', () => {
    expect(mascararProtocolo('230800123452026149')).toBe('23080.012345/2026-14')
    expect(mascararProtocolo('31062409201')).toBe('3106240920')
  })
})

describe('digitarProtocolo', () => {
  it('no meio do número, o cursor fica depois do dígito digitado', () => {
    // faltou o 2 em '23080.01|3452/026': o 2 entra depois do 1 e os dígitos andam
    expect(digitarProtocolo('23080.0123452/026', 9)).toEqual({
      texto: '23080.012345/2026',
      cursor: 9,
    })
  })

  it('o dígito que empurra a pontuação deixa o cursor depois dele, não do separador', () => {
    expect(digitarProtocolo('230800', 6)).toEqual({ texto: '23080.0', cursor: 7 })
  })

  it('apagar o separador só leva o cursor para antes dele', () => {
    // backspace logo depois do ponto de '23080.0123'
    expect(digitarProtocolo('230800123', 5)).toEqual({ texto: '23080.0123', cursor: 5 })
  })

  it('letra não entra, e o cursor não sai do lugar', () => {
    expect(digitarProtocolo('2308a0.0123', 5)).toEqual({ texto: '23080.0123', cursor: 4 })
  })

  it('com o número completo, a tecla a mais não entra nem empurra o último dígito', () => {
    expect(digitarProtocolo('23080.0192345/2026-14', 9)).toEqual({
      texto: '23080.012345/2026-14',
      cursor: 8,
    })
    expect(digitarProtocolo('31062409201', 11)).toEqual({ texto: '3106240920', cursor: 10 })
  })

  it('colar o número já formatado, ou no meio de um texto, funciona', () => {
    const colado = '23080.012345/2026-14'
    expect(digitarProtocolo(colado, colado.length)).toEqual({ texto: colado, cursor: 20 })

    const doEmail = 'Processo nº 23080.012345/2026-14, de 12/03/2026'
    expect(digitarProtocolo(doEmail, doEmail.length).texto).toBe(colado)
  })
})

describe('formatarProtocolo', () => {
  it('manda o processo com a pontuação, mesmo digitado sem ela', () => {
    expect(formatarProtocolo('23080012345202614')).toBe('23080.012345/2026-14')
  })

  it('manda o número do Sistema CEUA limpo, mesmo quando ele começa com 23080', () => {
    expect(formatarProtocolo('3106240920')).toBe('3106240920')
    expect(formatarProtocolo('23080.50920')).toBe('2308050920')
  })

  it('não corta dígito: o que sobra fica para a regra recusar', () => {
    expect(formatarProtocolo('230800123452026149')).toBe('23080.012345/2026-149')
  })
})

describe('conferirProtocolo', () => {
  it('aceita processos da UFSC, inclusive os de verificador 0 e 1', () => {
    for (const numero of [
      '23080.027699/2015-01',
      '23080.038397/2021-06',
      '23080.079383/2019-10',
      '23080.040077/2021-16',
      '23080.009760/2017-91',
      '23080.012345/2026-14',
    ]) {
      expect(conferirProtocolo(numero, HOJE), numero).toBeNull()
    }
  })

  it('separa o processo incompleto do verificador errado', () => {
    expect(conferirProtocolo('23080.012345/2026-1', HOJE)).toBe('O processo tem 17 dígitos')
    expect(conferirProtocolo('23080.012345/2026-11', HOJE)).toBe(
      'Dígito verificador errado: confira o número',
    )
  })

  it('recusa o processo de um ano que ainda não chegou', () => {
    expect(conferirProtocolo('23080.012345/2026-14', '2025-12-31')).toBe(
      'O ano do processo ainda não chegou',
    )
  })

  it('aceita o número do Sistema CEUA com a data do registro até hoje', () => {
    expect(conferirProtocolo('3106240920', HOJE)).toBeNull()
    expect(conferirProtocolo('4401201118', HOJE)).toBeNull()
    expect(conferirProtocolo('7971160320', HOJE)).toBeNull()
    expect(conferirProtocolo('1234051126', HOJE)).toBeNull()
  })

  it('o número de 10 dígitos que começa com 23080 é do Sistema CEUA', () => {
    expect(conferirProtocolo('2308050920', HOJE)).toBeNull()
    expect(conferirProtocolo('23080.50920', HOJE)).toBeNull()
  })

  it('separa o número incompleto da data errada ou futura', () => {
    expect(conferirProtocolo('310624092', HOJE)).toBe('O número do Sistema CEUA tem 10 dígitos')
    expect(conferirProtocolo('1234310220', HOJE)).toBe('Protocolo no formato incorreto')
    expect(conferirProtocolo('1234001320', HOJE)).toBe('Protocolo no formato incorreto')
    expect(conferirProtocolo('1234061126', HOJE)).toBe('Protocolo no formato incorreto')
  })

  it('campo em branco pede o protocolo', () => {
    expect(conferirProtocolo('', HOJE)).toBe('Informe o protocolo')
  })
})

describe('protocoloCeua', () => {
  it('devolve o número na forma que vai para a API', () => {
    expect(protocoloCeua.parse('23080012345202614')).toBe('23080.012345/2026-14')
    expect(protocoloCeua.parse('23080.50920')).toBe('2308050920')
  })

  it('recusa com a mensagem da regra, e trata o campo vazio como vazio', () => {
    const errado = protocoloCeua.safeParse('23080.012345/2026-11')
    expect(errado.error?.issues[0]?.message).toBe('Dígito verificador errado: confira o número')
    expect(protocoloCeua.safeParse(undefined).success).toBe(false)
  })
})
