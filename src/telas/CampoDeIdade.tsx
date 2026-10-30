import { Form, InputNumber, Segmented } from 'antd'
import { Formulario, Linha, Texto } from '@/componentes'
import { validadorDoPedido } from './solicitacao.schema'
import './Solicitacao.css'

const MODOS = [
  { value: 'faixa', label: 'Faixa' },
  { value: 'exata', label: 'Exata' },
]

/**
 * Idade na entrega: uma faixa ("de 20 a 40 dias") ou uma idade exata. Preenche os campos
 * 'modoIdade', 'idadeMin' e 'idadeMax' do formulário em que está; na exata o segundo
 * número some, e quem monta o pedido usa o mínimo como máximo
 */
export function CampoDeIdade({ className }: { className?: string }) {
  const form = Form.useFormInstance()
  const exata = Form.useWatch('modoIdade', form) === 'exata'

  return (
    <Formulario.Campo rotulo="Idade (dias)" {...(className ? { className } : {})}>
      <Linha espaco={8}>
        <Form.Item name="modoIdade" noStyle>
          <Segmented options={MODOS} />
        </Form.Item>

        <Form.Item name="idadeMin" noStyle rules={[{ validator: validadorDoPedido('idade') }]}>
          <InputNumber
            aria-label={exata ? 'Idade' : 'Idade mínima'}
            className="solicitacao__numero"
            controls={false}
            precision={0}
            inputMode="numeric"
          />
        </Form.Item>

        {!exata && (
          <>
            <Texto tom="secundario">a</Texto>
            <Form.Item
              name="idadeMax"
              noStyle
              dependencies={['idadeMin']}
              rules={[
                ({ getFieldValue }) => ({
                  // Com as duas em branco, o aviso fica só no mínimo, e não sai repetido
                  validator: (regra, valor: number | null | undefined) => {
                    const minimo: unknown = getFieldValue('idadeMin')
                    if (valor === null || valor === undefined) {
                      return typeof minimo === 'number'
                        ? Promise.reject(new Error('Informe até que idade'))
                        : Promise.resolve()
                    }
                    if (typeof minimo === 'number' && valor < minimo) {
                      return Promise.reject(new Error('Menor que a idade inicial'))
                    }
                    return validadorDoPedido('idade')(regra, valor)
                  },
                }),
              ]}
            >
              <InputNumber
                aria-label="Idade máxima"
                className="solicitacao__numero"
                controls={false}
                precision={0}
                inputMode="numeric"
              />
            </Form.Item>
          </>
        )}
      </Linha>
    </Formulario.Campo>
  )
}
