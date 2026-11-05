import { Form, InputNumber, Segmented } from 'antd'
import { Formulario, Linha, Texto } from '@/componentes'
import type { ModoDeIdade } from '@/dominio/solicitacao'
import { IDADE, conferirIdadeMaxima, validadorDeIdade } from './solicitacao.schema'
import './Solicitacao.css'

const MODOS: { value: ModoDeIdade; label: string }[] = [
  { value: 'faixa', label: 'Faixa' },
  { value: 'exata', label: 'Exata' },
]

/** Dias inteiros, digitados: sem setas, com a unidade dentro do campo e teclado numérico */
const DIAS = {
  className: 'solicitacao__numero',
  controls: false,
  precision: 0,
  inputMode: 'numeric',
  suffix: 'dias',
} as const

/**
 * Idade na entrega: uma faixa ("de 20 a 40 dias") ou uma idade exata. Preenche os campos
 * 'modoIdade', 'idadeMin' e 'idadeMax' do formulário em que está; na exata o segundo número
 * some, e faixaDeIdade usa o mínimo como máximo.
 *
 * Os dias se digitam: o laboratório pede o dia exato, que um Slider de 21 a 300 não acerta,
 * menos ainda no celular. Cada número é um item com nome, e não um noStyle: é assim que o
 * antd liga a mensagem de erro ao campo (aria-describedby e aria-invalid), e o leitor de tela
 * a lê. Por isso a unidade vai no suffix do InputNumber, e não num Space.Compact, que pede o
 * número noStyle. Cada item tem a largura do seu número, e a mensagem quebra embaixo dele,
 * sem invadir o vizinho
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
    <Formulario.Campo rotulo="Idade" {...(className ? { className } : {})}>
      <Linha espaco={8} estilo={{ alignItems: 'flex-start' }}>
        <Form.Item name="modoIdade" noStyle>
          <Segmented<ModoDeIdade> options={MODOS} aria-label="Idade em faixa ou exata" />
        </Form.Item>

        {/* "[20 dias] a [40 dias]" anda junto: se a linha quebrar, desce a faixa inteira */}
        <span className="solicitacao__numeros">
          <Form.Item
            name="idadeMin"
            className="solicitacao__item solicitacao__item--dias"
            rules={[{ validator: validadorDeIdade(idadeMinima) }]}
          >
            <InputNumber
              {...DIAS}
              aria-label={exata ? 'Idade, em dias' : 'Idade mínima, em dias'}
            />
          </Form.Item>

          {!exata && (
            <>
              <Texto tom="secundario" className="solicitacao__unidade">
                a
              </Texto>
              <Form.Item
                name="idadeMax"
                className="solicitacao__item solicitacao__item--dias"
                dependencies={['idadeMin']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, valor: number | null | undefined) => {
                      const erro = conferirIdadeMaxima(
                        getFieldValue('idadeMin'),
                        valor,
                        idadeMinima,
                      )
                      return erro ? Promise.reject(new Error(erro)) : Promise.resolve()
                    },
                  }),
                ]}
              >
                <InputNumber {...DIAS} aria-label="Idade máxima, em dias" />
              </Form.Item>
            </>
          )}
        </span>
      </Linha>
    </Formulario.Campo>
  )
}
