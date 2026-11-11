import dayjs from 'dayjs'
import { afterEach, describe, expect, it } from 'vitest'
import { hoje } from './data'
import { atualizarRelogio, deslocamentoDoRelogio, zerarRelogio } from './relogio'

const local = () => dayjs().format('YYYY-MM-DD')
const emDias = (n: number) => dayjs().add(n, 'day').format('YYYY-MM-DD')

describe('relógio do servidor', () => {
  afterEach(zerarRelogio)

  it('sem os campos da sessão, o hoje é o local', () => {
    atualizarRelogio({})
    expect(hoje()).toBe(local())
    expect(deslocamentoDoRelogio()).toBe(0)
  })

  it('com o hoje do servidor adiantado, o hoje() anda junto', () => {
    atualizarRelogio({ hoje: emDias(10), relogioDeTeste: { deslocamentoDias: 10 } })
    expect(deslocamentoDoRelogio()).toBe(10)
    expect(hoje()).toBe(emDias(10))
  })

  it('zerar volta ao hoje local', () => {
    atualizarRelogio({ hoje: emDias(3), relogioDeTeste: { deslocamentoDias: 3 } })
    zerarRelogio()
    expect(hoje()).toBe(local())
  })
})
