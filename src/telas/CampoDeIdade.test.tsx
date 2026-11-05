import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Botao, Formulario } from '@/componentes'
import type { CamposDeIdade } from '@/dominio/solicitacao'
import { renderizar } from '@/testes/renderizar'
import { CampoDeIdade } from './CampoDeIdade'

function Pedido() {
  return (
    <Formulario<CamposDeIdade> initialValues={{ modoIdade: 'faixa' }}>
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
    digitar('Idade mínima, em dias', '10')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    const minimo = screen.getByLabelText('Idade mínima, em dias')
    const maximo = screen.getByLabelText('Idade máxima, em dias')
    await waitFor(() => expect(descricao(minimo)).toBe('Mínimo de 21 dias'), ESPERA)
    expect(descricao(maximo)).toBe('Informe até que idade')
    expect(minimo.getAttribute('aria-invalid')).toBe('true')
    expect(maximo.getAttribute('aria-invalid')).toBe('true')
  })

  it('o máximo menor que o mínimo marca só o máximo', async () => {
    renderizar(<Pedido />)
    digitar('Idade mínima, em dias', '40')
    digitar('Idade máxima, em dias', '25')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    const maximo = screen.getByLabelText('Idade máxima, em dias')
    await waitFor(() => expect(descricao(maximo)).toBe('Menor que a idade inicial'), ESPERA)
    expect(maximo.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText('Idade mínima, em dias').getAttribute('aria-invalid')).toBeNull()
  })

  it('na idade exata o segundo número some', async () => {
    renderizar(<Pedido />)
    fireEvent.click(screen.getByText('Exata'))

    await waitFor(() => expect(screen.queryByLabelText('Idade máxima, em dias')).toBeNull(), ESPERA)
    expect(screen.getByLabelText('Idade, em dias')).toBeTruthy()
  })
})
