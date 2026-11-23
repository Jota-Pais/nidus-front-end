import { App, Form } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import { destinoDoLugar, MAX_VIUVAS_POR_CAIXA } from '@/dominio/caixa'
import type { LugarNaEstante } from '@/dominio/caixa'
import { useLevarParaViuvas } from '@/dominio/consultas'
import type { Casal, DataISO, FichaDeCasal, FichaDeViuvas } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje, formatarData, hoje, maisTarde } from '@/lib/data'
import { useAbrirFicha } from './abrirFicha'
import { Campo, LadoALado } from './CamposDaFicha'
import { EscolherCaixa } from './EscolherCaixa'
import './FichaDasViuvas.css'

export function FichaDasViuvas({ ficha }: { ficha: FichaDeViuvas }) {
  return (
    <div className="ficha__aba">
      <LadoALado>
        <Campo rotulo="Linhagem">{ficha.caixa.linhagem}</Campo>
        <Campo rotulo="Viúvas">
          {ficha.viuvas.length} de {MAX_VIUVAS_POR_CAIXA}
        </Campo>
      </LadoALado>

      {ficha.viuvas.length === 0 ? (
        <p className="ficha__vazio">Nenhuma viúva nesta caixa.</p>
      ) : (
        <table className="fichaDasViuvas__lista">
          <thead>
            <tr>
              <th>Veio da caixa</th>
              <th>Movida em</th>
            </tr>
          </thead>
          <tbody>
            {ficha.viuvas.map((viuva) => (
              <tr key={viuva.id}>
                <td>{viuva.caixaDeOrigem}</td>
                <td>{formatarData(viuva.dtViuvez)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function ViuvaDoCasal({ casal, ficha }: { casal: Casal; ficha: FichaDeCasal }) {
  const abrirFicha = useAbrirFicha()
  const { viuva } = casal

  if (viuva) {
    return (
      <div className="fichaDasViuvas__doCasal">
        <span>
          A fêmea foi para a caixa de viúvas {viuva.codigoCaixa} ({viuva.numeroVisivel}) em{' '}
          {formatarData(viuva.dtViuvez)}.
        </span>
        {abrirFicha && (
          <div>
            <Botao variante="fantasma" onClick={() => abrirFicha(viuva.idCaixa)}>
              Abrir a caixa {viuva.codigoCaixa}
            </Botao>
          </div>
        )}
      </div>
    )
  }

  if (!casal.podeVirarViuva) {
    return casal.porQueNaoViraViuva ? (
      <p className="ficha__vazio">{casal.porQueNaoViraViuva}</p>
    ) : null
  }

  return <TransferirParaViuvas casal={casal} ficha={ficha} />
}

interface CamposDaTransferencia {
  dtViuvez: DataISO
  destino: LugarNaEstante
}

function TransferirParaViuvas({ casal, ficha }: { casal: Casal; ficha: FichaDeCasal }) {
  const { message } = App.useApp()
  const levar = useLevarParaViuvas(casal.id)
  const [aberto, setAberto] = useState(false)
  const [form] = Form.useForm<CamposDaTransferencia>()
  const falha = useFalhaDoFormulario(form, ['dtViuvez', 'destino'])
  const { endereco } = ficha.caixa
  const desde = maisTarde(
    casal.dtEncerramento,
    ...ficha.partos.flatMap((parto) => [parto.dtPartoReal, parto.dtDesmameReal]),
  )

  if (!aberto) {
    return (
      <div>
        <Botao onClick={() => setAberto(true)}>Transferir a fêmea para uma caixa de viúvas</Botao>
      </div>
    )
  }

  function transferir({ dtViuvez, destino }: CamposDaTransferencia) {
    falha.limpar()
    levar.mutateAsync({ dtViuvez, ...destinoDoLugar(destino) }).then(
      (viuvas) =>
        void message.success(
          `A fêmea do casal ${casal.identificacao} foi para a caixa de viúvas ${viuvas.caixa.endereco.codigo}.`,
        ),
      (erro: Error) =>
        falha.mostrarComNomes(erro, (chave) =>
          chave === 'idCaixa' || chave.startsWith('posicao') ? 'destino' : chave,
        ),
    )
  }

  return (
    <Form
      name="viuva"
      form={form}
      layout="vertical"
      initialValues={{ dtViuvez: hoje() }}
      className="ficha__formulario"
      onFinish={transferir}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <Form.Item name="dtViuvez" label="Data" rules={[{ required: true, message: 'Data' }]}>
        <CampoDeData min={desde} max={ateHoje()} />
      </Form.Item>
      <Form.Item
        name="destino"
        label={`A caixa de viúvas (${casal.linhagem}, com vaga) ou uma posição vazia`}
        rules={[{ required: true, message: 'Clique na caixa de viúvas ou na posição vazia' }]}
      >
        <EscolherCaixa
          sala={endereco.sala}
          numeroVisivel={endereco.numeroVisivel}
          sexo={null}
          idLinhagem={casal.idLinhagem}
          aceitaVazia
          idOrigem={ficha.caixa.id}
          paraViuvas
        />
      </Form.Item>
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={levar.isPending}>
          Transferir
        </Botao>
        <Botao variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}
