import { App, Form, Input, InputNumber, Select, Table } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Aviso, Botao, CabecalhoDaTela, Etiqueta, Pilha, Secao, Texto } from '@/componentes'
import type { TomDeEtiqueta } from '@/componentes'
import { COLUNA } from '@/dominio/caixa'
import { buscarAtendimento, useAlocar, useCatalogo, useSolicitacoes } from '@/dominio/consultas'
import { descreverAnimais, descreverIdade, faixaDeIdade } from '@/dominio/solicitacao'
import type { CamposDeIdade } from '@/dominio/solicitacao'
import type {
  CaixaCandidata,
  CodigoEspecie,
  Origem,
  ResultadoDaBusca,
  Solicitacao,
} from '@/dominio/tipos'
import { formatarData } from '@/lib/data'
import { CampoDeIdade } from './CampoDeIdade'
import './Solicitacao.css'

const ORIGEM: Record<Origem, { rotulo: string; tom: TomDeEtiqueta }> = {
  de_fato: { rotulo: 'De fato', tom: 'sucesso' },
  previsao: { rotulo: 'Previsão', tom: 'informacao' },
}

/** Os números vêm nulos quando o técnico apaga o campo */
interface Remessa {
  machos: number | null
  femeas: number | null
  qualquer: number | null
  dataEntrega: string
}

/** A idade vem do CampoDeIdade, o mesmo da solicitação */
interface Criterios extends CamposDeIdade {
  especie: CodigoEspecie
  idLinhagem?: number
  remessas: Remessa[]
}

interface Resultado {
  remessa: Remessa
  busca: ResultadoDaBusca
}

/**
 * Dada a idade, as quantidades e as datas, quais caixas atendem. O plantel vem primeiro, por
 * proximidade de idade, e o acasalamento novo é a última alternativa
 */
export function BuscaDeAtendimento() {
  const { message } = App.useApp()
  const [form] = Form.useForm<Criterios>()
  const catalogo = useCatalogo()
  const solicitacoes = useSolicitacoes()
  const alocar = useAlocar()
  const [escolhida, setEscolhida] = useState<Solicitacao | null>(null)

  // cada remessa roda a mesma busca; as caixas sugeridas numa não voltam na seguinte
  const busca = useMutation({
    mutationFn: async (criterios: Criterios) => {
      const { especie, idLinhagem, remessas } = criterios
      const resultados: Resultado[] = []
      const excluir: number[] = []

      for (const remessa of remessas) {
        // Campo apagado conta como zero, o mesmo critério do pedido; sem isso iria 'null'
        // na URL e a API recusaria a busca
        const resultado = await buscarAtendimento({
          especie,
          idLinhagem,
          ...faixaDeIdade(criterios),
          machos: remessa.machos ?? 0,
          femeas: remessa.femeas ?? 0,
          qualquer: remessa.qualquer ?? 0,
          dataEntrega: remessa.dataEntrega,
          excluir,
        })
        resultados.push({ remessa, busca: resultado })
        excluir.push(...resultado.candidatas.filter((c) => c.sugerida).map((c) => c.idCaixa))
      }

      return resultados
    },
    onError: (erro) => void message.error(erro.message),
  })

  const especie = Form.useWatch('especie', form)
  const linhagens =
    catalogo.data?.especies
      .find((e) => e.codigo === especie)
      ?.linhagens.filter((l) => l.ativa)
      .map((l) => ({ value: l.id, label: l.nome })) ?? []

  const pendentes = (solicitacoes.data ?? []).filter((s) => s.status === 'enviada')

  function escolher(id: number | undefined) {
    const solicitacao = pendentes.find((s) => s.id === id) ?? null
    setEscolhida(solicitacao)
    busca.reset()
    if (!solicitacao) return

    const criterios: Criterios = {
      especie: solicitacao.especie,
      idLinhagem: solicitacao.idLinhagem,
      modoIdade: solicitacao.idadeMin === solicitacao.idadeMax ? 'exata' : 'faixa',
      idadeMin: solicitacao.idadeMin,
      idadeMax: solicitacao.idadeMax,
      remessas: [
        {
          machos: solicitacao.machos,
          femeas: solicitacao.femeas,
          qualquer: solicitacao.qualquer,
          dataEntrega: solicitacao.dataEntrega,
        },
      ],
    }
    form.setFieldsValue(criterios)
    busca.mutate(criterios)
  }

  function limpar() {
    setEscolhida(null)
    busca.reset()
    form.resetFields()
  }

  function alocarSugeridas(resultado: ResultadoDaBusca) {
    if (!escolhida) return
    const itens = resultado.candidatas
      .filter((c) => c.sugerida)
      .map((c) => ({ idParto: c.idParto, machos: c.alocar.m, femeas: c.alocar.f }))

    alocar.mutate(
      { idSolicitacao: escolhida.id, itens },
      {
        onSuccess: () => {
          void message.success(`Caixas alocadas para a solicitação #${escolhida.id}.`)
          limpar()
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Técnico"
        titulo="Busca de atendimento"
        descricao="Quais caixas atendem um pedido: primeiro o plantel, pela idade mais próxima, e por último o acasalamento novo."
      />

      <Secao titulo="Pedido">
        <Pilha espaco={12}>
          <div>
            <Texto tom="rotulo">Solicitação recebida</Texto>
            <Select
              allowClear
              style={{ width: '100%', marginTop: 6 }}
              placeholder={
                pendentes.length === 0
                  ? 'Nenhuma solicitação aguardando análise'
                  : 'Selecione uma solicitação'
              }
              loading={solicitacoes.isPending}
              value={escolhida?.id}
              onChange={escolher}
              options={pendentes.map((s) => ({
                value: s.id,
                label: `#${s.id} — ${s.linhagem} ${descreverAnimais(s)}, ${descreverIdade(s)}, entrega ${formatarData(s.dataEntrega)} (${s.pesquisador})`,
              }))}
            />
          </div>

          <Texto tom="secundario">Ou preencha à mão:</Texto>

          <Form
            form={form}
            layout="vertical"
            onFinish={(criterios) => busca.mutate(criterios)}
            initialValues={{
              especie: 'rato',
              modoIdade: 'exata',
              idadeMin: 28,
              remessas: [{ machos: 0, femeas: 0, qualquer: 0 }],
            }}
          >
            <div className="busca__criterios">
              <Form.Item name="especie" label="Espécie">
                <Select
                  options={[
                    { value: 'rato', label: 'Rato' },
                    { value: 'camundongo', label: 'Camundongo' },
                  ]}
                  onChange={() => form.setFieldValue('idLinhagem', undefined)}
                />
              </Form.Item>
              <Form.Item name="idLinhagem" label="Linhagem (opcional)">
                <Select allowClear options={linhagens} placeholder="Qualquer linhagem" />
              </Form.Item>
              {/* A busca procura qualquer idade a partir de 1 dia, como a API aceita; o
                  mínimo de 21 é só do pedido do pesquisador */}
              <CampoDeIdade className="busca__idade" idadeMinima={1} />
            </div>

            <Texto tom="rotulo">Remessas</Texto>
            <Form.List name="remessas">
              {(campos, { add, remove }) => (
                <>
                  {campos.map((campo, indice) => (
                    <div key={campo.key} className="busca__remessa">
                      <span className="busca__numero">#{indice + 1}</span>
                      <Form.Item name={[campo.name, 'machos']} label="Machos">
                        <InputNumber min={0} />
                      </Form.Item>
                      <Form.Item name={[campo.name, 'femeas']} label="Fêmeas">
                        <InputNumber min={0} />
                      </Form.Item>
                      <Form.Item name={[campo.name, 'qualquer']} label="Qualquer sexo">
                        <InputNumber min={0} />
                      </Form.Item>
                      <Form.Item
                        name={[campo.name, 'dataEntrega']}
                        label="Data de entrega"
                        rules={[{ required: true, message: 'Informe a data' }]}
                      >
                        <Input type="date" />
                      </Form.Item>
                      {campos.length > 1 && (
                        <Botao
                          variante="fantasma"
                          onClick={() => remove(campo.name)}
                          style={{ marginBottom: 24 }}
                        >
                          Remover
                        </Botao>
                      )}
                    </div>
                  ))}
                  <div className="busca__acoes">
                    <Botao onClick={() => add({ machos: 0, femeas: 0, qualquer: 0 })}>
                      Mais uma remessa
                    </Botao>
                    <Botao variante="primario" htmlType="submit" loading={busca.isPending}>
                      Buscar caixas
                    </Botao>
                    {busca.data && (
                      <Botao variante="fantasma" onClick={limpar}>
                        Limpar
                      </Botao>
                    )}
                  </div>
                </>
              )}
            </Form.List>
          </Form>
        </Pilha>
      </Secao>

      {busca.data?.map(({ remessa, busca: resultado }, indice) => (
        <Secao
          key={indice}
          titulo={`Remessa #${indice + 1} · ${formatarData(remessa.dataEntrega)}`}
          acoes={
            <Etiqueta>
              {descreverAnimais(remessa)} · idade aceita {resultado.faixa.min} a{' '}
              {resultado.faixa.max} dias
            </Etiqueta>
          }
        >
          <Pilha espaco={12}>
            <Resumo resultado={resultado} />

            <Table<CaixaCandidata>
              rowKey="idParto"
              pagination={false}
              scroll={{ x: true }}
              dataSource={resultado.candidatas}
              locale={{ emptyText: 'Nenhuma caixa do plantel atende esta data.' }}
              columns={[
                {
                  title: 'Sugerida',
                  render: (_, c) => (c.sugerida ? <Etiqueta tom="sucesso">Sim</Etiqueta> : '—'),
                },
                {
                  title: 'Origem',
                  render: (_, c) => (
                    <Etiqueta tom={ORIGEM[c.origem].tom}>{ORIGEM[c.origem].rotulo}</Etiqueta>
                  ),
                },
                { title: 'Caixa', render: (_, c) => `${c.numeroVisivel} · ${c.codigo}` },
                { title: 'Casal', render: (_, c) => `${c.casal} · ${c.parto}º parto` },
                { title: 'Kanban', render: (_, c) => COLUNA[c.estado].rotulo },
                { title: 'Nascimento', render: (_, c) => formatarData(c.nascimento) },
                { title: 'Idade na entrega', render: (_, c) => `${c.idadeNaEntrega} dias` },
                {
                  title: 'Disponível',
                  render: (_, c) => `${c.disponivel.m} M · ${c.disponivel.f} F`,
                },
                {
                  title: 'Alocar',
                  render: (_, c) => (c.sugerida ? `${c.alocar.m} M · ${c.alocar.f} F` : '—'),
                },
              ]}
            />

            {escolhida && busca.data?.length === 1 && (
              <>
                {/* a API só aloca o pedido inteiro: com falta, o botão nem tenta */}
                {!cobreOPedido(resultado) && (
                  <Texto tom="secundario">
                    Só dá para alocar o pedido inteiro. Sem animais para completar, recuse a
                    solicitação com o motivo ou aguarde.
                  </Texto>
                )}
                <div className="solicitacao__acoes">
                  <Botao
                    variante="primario"
                    loading={alocar.isPending}
                    disabled={!cobreOPedido(resultado)}
                    onClick={() => alocarSugeridas(resultado)}
                  >
                    Alocar as caixas sugeridas na solicitação #{escolhida.id}
                  </Botao>
                </div>
              </>
            )}
          </Pilha>
        </Secao>
      ))}
    </Pilha>
  )
}

/** As caixas sugeridas cobrem tudo o que foi pedido, sem faltar animal */
function cobreOPedido({ candidatas, deficit }: ResultadoDaBusca): boolean {
  return candidatas.some((c) => c.sugerida) && deficit.m + deficit.f + deficit.qualquer === 0
}

function Resumo({ resultado }: { resultado: ResultadoDaBusca }) {
  const { deficit, casaisAFormar, acasalamentoNovo } = resultado

  const falta = { machos: deficit.m, femeas: deficit.f, qualquer: deficit.qualquer }

  if (deficit.m + deficit.f + deficit.qualquer === 0) {
    return <Aviso tom="sucesso" titulo="O plantel cobre esta remessa." />
  }

  return (
    <Aviso tom="atencao" titulo={`Faltam ${descreverAnimais(falta)} no plantel.`}>
      Última alternativa: formar {casaisAFormar}{' '}
      {casaisAFormar === 1 ? 'casal novo' : 'casais novos'}
      {acasalamentoNovo.viavel
        ? ', e a entrega cabe nesta data.'
        : `, mas não dá para esta data: com acasalamento novo, a entrega passa a ser possível a partir de ${formatarData(acasalamentoNovo.dataMinimaDeEntrega)}.`}
    </Aviso>
  )
}
