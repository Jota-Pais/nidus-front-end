import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Formulario } from '@/componentes'
import { renderizar } from '@/testes/renderizar'
import { CampoDoProtocolo } from './CampoDoProtocolo'

function montar() {
  renderizar(
    <Formulario>
      <CampoDoProtocolo name="protocoloCeua" rotulo="Protocolo CEUA" />
    </Formulario>,
  )
  return screen.getByLabelText<HTMLInputElement>('Protocolo CEUA')
}

/** O campo logo depois de uma tecla ou colagem: o texto e onde o cursor ficou */
function digitar(campo: HTMLInputElement, texto: string, cursor = texto.length) {
  fireEvent.change(campo, {
    target: { value: texto, selectionStart: cursor, selectionEnd: cursor },
  })
}

describe('campo do protocolo', { timeout: 20_000 }, () => {
  it('põe a máscara durante a digitação, com o cursor depois do dígito digitado', () => {
    const campo = montar()

    digitar(campo, '23080.0123452/026', 9)

    expect(campo.value).toBe('23080.012345/2026')
    expect(campo.selectionStart).toBe(9)
  })

  it('letra não entra', () => {
    const campo = montar()

    digitar(campo, '2308a', 5)

    expect(campo.value).toBe('2308')
  })

  it('ao sair, o número de 10 dígitos que começa com 23080 fica limpo', () => {
    const campo = montar()

    digitar(campo, '2308050920')
    expect(campo.value).toBe('23080.50920')

    fireEvent.blur(campo)
    expect(campo.value).toBe('2308050920')
  })

  it('confere ao sair do campo', async () => {
    const campo = montar()

    digitar(campo, '23080.012345/2026-11')
    fireEvent.blur(campo)

    expect(await screen.findByText('Dígito verificador errado: confira o número')).toBeTruthy()
  })

  it('não tem ajuda embaixo: o formato só aparece na mensagem de quem erra', () => {
    const campo = montar()

    expect(campo.closest('.ant-form-item')?.querySelector('.ant-form-item-extra')).toBeNull()
    expect(screen.queryByText(/XXXXXX/)).toBeNull()
  })
})
