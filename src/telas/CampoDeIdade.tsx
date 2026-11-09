import { Form, InputNumber, Segmented } from 'antd'
import { Formulario } from '@/componentes'
import type { ModoDeIdade } from '@/dominio/pedido'
import { IDADE, conferirIdadeMaxima, validadorDeIdade } from './solicitacao.schema'
import './Solicitacao.css'

const MODOS: { value: ModoDeIdade; label: string }[] = [
  { value: 'faixa', label: 'Faixa' },
  { value: 'exata', label: 'Exata' },
]

/** Dias inteiros, digitados: sem setas e com teclado numérico. A unidade vai no rótulo */
const DIAS = {
  className: 'solicitacao__numero',
  controls: false,
  precision: 0,
  inputMode: 'numeric',
} as const

/**
 * Idade na entrega: uma faixa ("de 20 a 40 dias") ou uma idade exata. Preenche os campos
 * 'modoIdade', 'idadeMin' e 'idadeMax' do formulário em que está; na exata o segundo número
 * some, e faixaDeIdade usa o mínimo como máximo.
 *
 * Os dias se digitam: o laboratório pede o dia exato, que um Slider de 21 a 300 não acerta,
 * menos ainda no celular. Cada número é um campo com nome e rótulo em cima, e não um noStyle:
 * é assim que o antd liga a mensagem de erro ao campo (aria-describedby e aria-invalid), e o
 * leitor de tela a lê. A unidade vai no rótulo ("Idade mínima (dias)"), nunca dentro da caixa.
 * Cada campo tem a largura do seu número, e a mensagem quebra embaixo dele, sem invadir o
 * vizinho
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
    <div className={['solicitacao__idade', className].filter(Boolean).join(' ')}>
      <Formulario.Campo rotulo="Idade" name="modoIdade">
        <Segmented<ModoDeIdade> options={MODOS} aria-label="Idade em faixa ou exata" />
      </Formulario.Campo>

      <Formulario.Campo
        name="idadeMin"
        rotulo={exata ? 'Idade (dias)' : 'Idade mínima (dias)'}
        className="solicitacao__campo--dias"
        rules={[{ validator: validadorDeIdade(idadeMinima) }]}
      >
        <InputNumber {...DIAS} />
      </Formulario.Campo>

      {/* Na exata a idade máxima some, mas o lugar dela fica: sem ele, o campo ao lado (a
          linhagem, no pedido) cresce no vão e os campos mudam de lugar a cada troca. Inerte e
          invisível, ela sai do Tab e do leitor de tela, e sem regra não barra o envio */}
      <div
        className={exata ? 'solicitacao__campo--dias solicitacao__guardado' : 'solicitacao__campo--dias'}
        inert={exata}
      >
        <Formulario.Campo
          name="idadeMax"
          rotulo="Idade máxima (dias)"
          dependencies={['idadeMin']}
          rules={
            exata
              ? []
              : [
                  ({ getFieldValue }) => ({
                    validator: (_, valor: number | null | undefined) => {
                      const erro = conferirIdadeMaxima(getFieldValue('idadeMin'), valor, idadeMinima)
                      return erro ? Promise.reject(new Error(erro)) : Promise.resolve()
                    },
                  }),
                ]
          }
        >
          <InputNumber {...DIAS} />
        </Formulario.Campo>
      </div>
    </div>
  )
}
