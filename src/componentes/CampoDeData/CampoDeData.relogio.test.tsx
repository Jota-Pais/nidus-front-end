import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it } from 'vitest'
import { hoje } from '@/lib/data'
import { atualizarRelogio, zerarRelogio } from '@/lib/relogio'
import { CampoDeData } from '.'

describe('CampoDeData com o relógio do servidor', () => {
  afterEach(zerarRelogio)

  it('o mínimo por hoje() apaga os dias antes do hoje do servidor', async () => {
    const daqui40 = dayjs().add(40, 'day')
    atualizarRelogio({
      hoje: daqui40.format('YYYY-MM-DD'),
      relogioDeTeste: { deslocamentoDias: 40 },
    })
    const hojeDoServidor = hoje()
    expect(hojeDoServidor).toBe(daqui40.format('YYYY-MM-DD'))

    render(<CampoDeData min={hojeDoServidor} />)
    fireEvent.click(screen.getByPlaceholderText('dd/mm/aaaa'))

    const dia = (d: dayjs.Dayjs) => document.querySelector(`td[title="${d.format('YYYY-MM-DD')}"]`)
    await waitFor(() => expect(dia(daqui40)).not.toBeNull())
    expect(dia(daqui40)?.className).not.toContain('ant-picker-cell-disabled')
    const ontem = daqui40.subtract(1, 'day')
    if (dia(ontem)) expect(dia(ontem)?.className).toContain('ant-picker-cell-disabled')
  })
})
