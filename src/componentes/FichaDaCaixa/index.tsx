import { Modal } from 'antd'
import type { TableProps } from 'antd'
import { useSearchParams } from 'react-router-dom'
import type { CicloReprodutivo, Ficha } from '@/dominio/ficha'
import { PARAM_ABA, PARAM_FICHA, useFicha } from '@/dominio/useFicha'
import { Abas } from '../Abas'
import { Data } from '../Data'
import { DataPrevistaOuReal } from '../DataPrevistaOuReal'
import { EstadoDaConsulta } from '../../layout/EstadoDaConsulta'
import { IndicadorDeCiclo } from '../IndicadorDeCiclo'
import { LinhaDoTempo } from '../LinhaDoTempo'
import { ListaDeDefinicoes } from '../ListaDeDefinicoes'
import type { Definicao } from '../ListaDeDefinicoes'
import { MarcaEstadoCaixa, MarcaGrauCerteza } from '@/dominio/Legenda'
import { QuantidadePorSexo } from '../QuantidadePorSexo'
import { Tabela } from '../Tabela'
import { TagDeEspecie } from '../TagDeEspecie'
import { TagDeFinalidade } from '../TagDeFinalidade'

function SecaoDados({ ficha }: { ficha: Ficha }) {
  const dadosDaCaixa: Definicao[] = [
    { rotulo: 'Posição', valor: `${ficha.caixa.endereco.numeroVisivel} · ${ficha.caixa.endereco.sala} · ${ficha.caixa.endereco.codigo}` },
    { rotulo: 'Espécie', valor: <TagDeEspecie especie={ficha.caixa.especie as 'rato' | 'camundongo'} /> },
    { rotulo: 'Linhagem', valor: ficha.caixa.linhagem ?? '—' },
    { rotulo: 'Finalidade', valor: <TagDeFinalidade finalidade={ficha.caixa.finalidade} /> },
    { rotulo: 'Estado', valor: <MarcaEstadoCaixa estado={ficha.caixa.estado} /> },
  ]

  const dadosDoCasal: Definicao[] = ficha.casal
    ? [
        { rotulo: 'Casal', valor: ficha.casal.identificacao },
        {
          rotulo: 'Ciclo',
          valor: <IndicadorDeCiclo atual={ficha.casal.cicloAtual} maximo={ficha.casal.maxCiclos} />,
        },
        { rotulo: 'Formado em', valor: <Data valor={ficha.casal.dtFormacao} /> },
        { rotulo: 'Situação', valor: ficha.casal.ativo ? 'Ativo' : 'Encerrado' },
        ...(ficha.casal.dtEncerramento
          ? [
              { rotulo: 'Encerrado em', valor: <Data valor={ficha.casal.dtEncerramento} /> },
              { rotulo: 'Motivo do encerramento', valor: ficha.casal.motivoEncerramento ?? '—', colunas: 2 },
            ]
          : []),
      ]
    : []

  return (
    <>
      <ListaDeDefinicoes titulo="Caixa" itens={dadosDaCaixa} />
      {ficha.casal ? (
        <ListaDeDefinicoes titulo="Casal" itens={dadosDoCasal} />
      ) : (
        <p>Esta caixa nunca teve casal formado.</p>
      )}
    </>
  )
}

function SecaoCiclos({ ciclos }: { ciclos: CicloReprodutivo[] }) {
  if (ciclos.length === 0) {
    return <p>Nenhum ciclo reprodutivo nesta posição ainda.</p>
  }

  const colunas: TableProps<CicloReprodutivo>['columns'] = [
    { title: 'Ciclo', dataIndex: 'ordem', width: 70 },
    { title: 'Acasalamento', render: (_, c) => <Data valor={c.dtAcasalamento} /> },
    {
      title: 'Parto',
      render: (_, c) => <DataPrevistaOuReal previsto={c.dtPartoPrevisto} real={c.dtPartoReal} rotulo="Parto" />,
    },
    { title: 'Nascidos', render: (_, c) => <QuantidadePorSexo valor={{ m: c.nascidoM ?? 0, f: c.nascidoF ?? 0 }} discreto /> },
    {
      title: 'Desmame',
      render: (_, c) => (
        <DataPrevistaOuReal previsto={c.dtDesmamePrevisto} real={c.dtDesmameReal} rotulo="Desmame" />
      ),
    },
    { title: 'Disponível', render: (_, c) => <QuantidadePorSexo valor={c.disponivel} discreto /> },
    { title: 'Grau', render: (_, c) => <MarcaGrauCerteza grau={c.grauCerteza} /> },
  ]

  return <Tabela<CicloReprodutivo> rowKey="id" columns={colunas} dataSource={ciclos} pagination={false} />
}

/**
 * RF-INF-04 + RF-REP-02 - a ficha da posição, aberta pelo card da grade e pelo card do
 * quadro (RF-CIC-02: mesma fonte, nunca diverge)
 */
export function FichaDaCaixa() {
  const [params, setParams] = useSearchParams()
  const idParam = params.get(PARAM_FICHA)
  const idCaixa = idParam === null ? null : Number(idParam)
  const aba = params.get(PARAM_ABA) ?? 'dados'

  const ficha = useFicha(idCaixa)

  function fechar() {
    setParams((atual) => {
      const proximo = new URLSearchParams(atual)
      proximo.delete(PARAM_FICHA)
      proximo.delete(PARAM_ABA)
      return proximo
    })
  }

  function trocarAba(chave: string) {
    setParams((atual) => {
      const proximo = new URLSearchParams(atual)
      proximo.set(PARAM_ABA, chave)
      return proximo
    })
  }

  return (
    <Modal
      open={idCaixa !== null}
      onCancel={fechar}
      footer={null}
      width={760}
      destroyOnHidden
      title={ficha.data ? `Ficha · ${ficha.data.caixa.endereco.codigo}` : 'Ficha da posição'}
    >
      <EstadoDaConsulta consulta={ficha} rotulo="Carregando a ficha…">
        {ficha.data && (
          <Abas
            chave={aba}
            aoTrocar={trocarAba}
            abas={[
              { chave: 'dados', rotulo: 'Dados', conteudo: <SecaoDados ficha={ficha.data} /> },
              { chave: 'ciclos', rotulo: 'Ciclos', conteudo: <SecaoCiclos ciclos={ficha.data.ciclos} /> },
              {
                chave: 'eventos',
                rotulo: 'Eventos',
                conteudo: <LinhaDoTempo eventos={ficha.data.eventos} />,
              },
            ]}
          />
        )}
      </EstadoDaConsulta>
    </Modal>
  )
}
