import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Botao, Formulario } from '@/componentes'
import type { CamposDeIdade } from '@/dominio/pedido'
import { renderizar } from '@/testes/renderizar'
import { CampoDeIdade } from './CampoDeIdade'

function Pedido({ aoEnviar }: { aoEnviar?: (campos: CamposDeIdade) => void }) {
  return (
    <Formulario<CamposDeIdade> initialValues={{ modoIdade: 'faixa' }} onFinish={aoEnviar}>
      <CampoDeIdade />
      <Botao htmlType="submit">Enviar</Botao>
    </Formulario>
  )
}

/** O que o leitor de tela lê ao chegar no campo: o texto apontado pelo aria-describedby */
function descricao(campo: HTMLElement): string {
  const ids = campo.getAttribute('aria-describedby')?.split(' ') ?? []
  return ids.map((id) => document.getElementById(id)?.textContent ?? '(sem elemento)').join(' ')
}

function digitar(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

// A validação do antd é assíncrona, e com os outros arquivos rodando junto o jsdom passa do
// 1 s padrão do waitFor
const ESPERA = { timeout: 5_000 }

describe('CampoDeIdade', { timeout: 20_000 }, () => {
  it('cada número tem a sua mensagem, ligada a ele pelo aria-describedby', async () => {
    renderizar(<Pedido />)
    digitar('Idade mínima (dias)', '10')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    const minimo = screen.getByLabelText('Idade mínima (dias)')
    const maximo = screen.getByLabelText('Idade máxima (dias)')
    await waitFor(() => expect(descricao(minimo)).toBe('Mínimo de 21 dias'), ESPERA)
    expect(descricao(maximo)).toBe('Informe a idade máxima')
    expect(minimo.getAttribute('aria-invalid')).toBe('true')
    expect(maximo.getAttribute('aria-invalid')).toBe('true')
  })

  it('o máximo menor que o mínimo marca só o máximo', async () => {
    renderizar(<Pedido />)
    digitar('Idade mínima (dias)', '40')
    digitar('Idade máxima (dias)', '25')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    const maximo = screen.getByLabelText('Idade máxima (dias)')
    await waitFor(() => expect(descricao(maximo)).toBe('Menor que a idade mínima'), ESPERA)
    expect(maximo.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText('Idade mínima (dias)').getAttribute('aria-invalid')).toBeNull()
  })

  it('na idade exata o segundo número some, mas guarda o lugar', async () => {
    renderizar(<Pedido />)
    fireEvent.click(screen.getByText('Exata'))

    await waitFor(() => expect(screen.getByLabelText('Idade (dias)')).toBeTruthy(), ESPERA)
    // inerte e invisível, fora do Tab e do leitor de tela, mas no mesmo lugar: assim o campo
    // ao lado não cresce no vão
    expect(screen.getByLabelText('Idade máxima (dias)').closest('[inert]')).not.toBeNull()
  })

  it('na idade exata a máxima que sobrou da faixa não barra o envio', async () => {
    const enviar = vi.fn()
    renderizar(<Pedido aoEnviar={enviar} />)
    digitar('Idade mínima (dias)', '40')
    digitar('Idade máxima (dias)', '25')
    fireEvent.click(screen.getByText('Exata'))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(enviar).toHaveBeenCalled(), ESPERA)
  })
})
