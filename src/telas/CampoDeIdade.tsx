import { Form, InputNumber, Segmented } from 'antd'
import { Formulario, Linha, Texto } from '@/componentes'
import type { ModoDeIdade } from '@/dominio/solicitacao'
import { IDADE, conferirIdadeMaxima, validadorDeIdade } from './solicitacao.schema'
import './Solicitacao.css'

const MODOS: { value: ModoDeIdade; label: string }[] = [
  { value: 'faixa', label: 'Faixa' },
  { value: 'exata', label: 'Exata' },
]

/**
 * Idade na entrega: uma faixa ("de 20 a 40 dias") ou uma idade exata. Preenche os campos
 * 'modoIdade', 'idadeMin' e 'idadeMax' do formulário em que está; na exata o segundo número
 * some, e faixaDeIdade usa o mínimo como máximo.
 *
 * Cada número é um item com nome, e não um noStyle: é assim que o antd liga a mensagem de
 * erro ao campo (aria-describedby), e o leitor de tela a lê
 */
export function CampoDeIdade({
  className,
  idadeMinima = IDADE.minima,
}: {
  className?: string
  /** O pedido começa em 21 dias, o desmame; a busca do técnico pode procurar menos */
  idadeMinima?: number
}) {
  const form = Form.useFormInstance()
  const exata = Form.useWatch('modoIdade', form) === 'exata'

  return (
    <Formulario.Campo rotulo="Idade (dias)" {...(className ? { className } : {})}>
      <Linha espaco={8} estilo={{ alignItems: 'flex-start' }}>
        <Form.Item name="modoIdade" noStyle>
          <Segmented<ModoDeIdade> options={MODOS} aria-label="Idade em faixa ou exata" />
        </Form.Item>

        <Form.Item
          name="idadeMin"
          className="solicitacao__item"
          rules={[{ validator: validadorDeIdade(idadeMinima) }]}
        >
          <InputNumber
            aria-label={exata ? 'Idade, em dias' : 'Idade mínima, em dias'}
            className="solicitacao__numero"
            controls={false}
            precision={0}
            inputMode="numeric"
          />
        </Form.Item>

        {/* "a [40]" anda junto: se a linha quebrar, o "a" não fica sozinho */}
        {!exata && (
          <span className="solicitacao__quantidade">
            <Texto tom="secundario" className="solicitacao__unidade">
              a
            </Texto>
            <Form.Item
              name="idadeMax"
              className="solicitacao__item"
              dependencies={['idadeMin']}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, valor: number | null | undefined) => {
                    const erro = conferirIdadeMaxima(getFieldValue('idadeMin'), valor, idadeMinima)
                    return erro ? Promise.reject(new Error(erro)) : Promise.resolve()
                  },
                }),
              ]}
            >
              <InputNumber
                aria-label="Idade máxima, em dias"
                className="solicitacao__numero"
                controls={false}
                precision={0}
                inputMode="numeric"
              />
            </Form.Item>
          </span>
        )}
      </Linha>
    </Formulario.Campo>
  )
}
