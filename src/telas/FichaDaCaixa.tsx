import { App, Form, Input, InputNumber, Modal, Select, Tabs } from 'antd'
import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Aviso, Botao, CampoDeData, Etiqueta, Linha, Texto } from '@/componentes'
import { COR_DO_PARTO } from '@/app/tokens'
import { corDoParto, descreverFalta, MAX_PARTOS_POR_CASAL, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import {
  useCatalogo,
  useCorrigirEvento,
  useFicha,
  useFormarCasal,
  useRegistrarNaFicha,
} from '@/dominio/consultas'
import type { CasalNovo, EventoCorrigivel } from '@/dominio/consultas'
import type { Casal, CodigoEspecie, DataISO, Ficha, Parto } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { descreverDias, formatarData, hoje, idadeEmDias } from '@/lib/data'
import { Campo, LadoALado, Total } from './CamposDaFicha'
import { DesmamadosDoParto, FichaDoEstoque, VirarCaixaDeEstoque } from './EstoqueDaFicha'
import './FichaDaCaixa.css'

/** Posição vazia da grade: a ficha abre com o formulário de casal, e a caixa nasce com ele */
export interface PosicaoVazia {
  idEstante: number
  face: 'frontal' | 'traseira'
  linha: number
  coluna: number
  codigo: string
  sala: string
  numeroVisivel: string
}

const ROTULO_ESPECIE = { rato: 'Rato', camundongo: 'Camundongo' } as const

/** A ficha da caixa, aberta pelo card do kanban e pela célula da grade */
export function FichaDaCaixa({
  idCaixa,
  posicaoVazia = null,
  aoFechar,
}: {
  idCaixa: number | null
  posicaoVazia?: PosicaoVazia | null
  aoFechar: () => void
}) {
  // depois de formar casal numa posição vazia, a ficha passa a ser a da caixa criada
  const [idCriado, setIdCriado] = useState<number | null>(null)
  const id = idCaixa ?? idCriado
  const ficha = useFicha(id)
  const [escolhido, setEscolhido] = useState<Escolha | null>(null)
  // a caixa de estoque tem a ficha dela, sem casal nem parto
  const deCasal = ficha.data?.tipo === 'casal' ? ficha.data : undefined
  const deEstoque = ficha.data?.tipo === 'estoque' ? ficha.data : undefined

  const escolha = escolhido ?? escolhaInicial(deCasal)
  const partoAtivo = escolha.ordem
  // parto de um casal de antes: a ninhada e a reserva são as dele, e o resto da ficha é da caixa
  const anterior = deCasal?.anteriores.find((a) => a.casal.id === escolha.idCasal)
  const vista = deCasal && anterior ? { ...deCasal, casal: anterior.casal, partos: anterior.partos } : deCasal
  const endereco = ficha.data?.caixa.endereco ?? posicaoVazia

  function fechar() {
    setEscolhido(null)
    setIdCriado(null)
    aoFechar()
  }

  return (
    <Modal
      open={id !== null || posicaoVazia !== null}
      onCancel={fechar}
      footer={null}
      width={760}
      destroyOnHidden
      styles={{
        header: {
          background: deEstoque ? `var(--estado-${deEstoque.caixa.estado}-fundo)` : corDoParto(partoAtivo).fundo,
          margin: '-20px -24px 0',
          padding: '16px 24px',
        },
      }}
      title={
        <Linha espaco={10}>
          <span>Ficha · {endereco?.codigo ?? 'caixa'}</span>
          {endereco && (
            <Etiqueta>
              {endereco.sala} · {endereco.numeroVisivel}
            </Etiqueta>
          )}
          {deEstoque && <Etiqueta>Caixa de estoque {SIMBOLO_DO_SEXO[deEstoque.caixa.sexo]}</Etiqueta>}
        </Linha>
      }
    >
      {id === null && posicaoVazia ? (
        <div className="ficha__aba">
          <p className="ficha__vazio">Posição vazia. Forme um casal para ocupar a caixa.</p>
          <FormarCasal
            alvo={{
              posicao: {
                idEstante: posicaoVazia.idEstante,
                face: posicaoVazia.face,
                linha: posicaoVazia.linha,
                coluna: posicaoVazia.coluna,
              },
            }}
            especie={null}
            aoFormar={setIdCriado}
          />
        </div>
      ) : (
        <EstadoDaConsulta consulta={ficha}>
          {deEstoque && <FichaDoEstoque ficha={deEstoque} />}
          {deCasal && vista && (
            <>
              <div className="ficha__partos">
                <Texto tom="rotulo">Parto</Texto>
                {COR_DO_PARTO.map(({ cor }, indice) => (
                  <BotaoDoParto
                    key={cor}
                    ordem={indice + 1}
                    ativo={escolha.idCasal === null && indice + 1 === partoAtivo}
                    aoEscolher={() => setEscolhido({ idCasal: null, ordem: indice + 1 })}
                  />
                ))}
              </div>
              {/* as ninhadas que um casal encerrado deixou na caixa continuam nela */}
              {deCasal.anteriores.map(({ casal, partos }) => (
                <div key={casal.id} className="ficha__partos">
                  <Texto tom="rotulo">Ninhadas do casal {casal.identificacao} (encerrado)</Texto>
                  {partos.map((parto) => (
                    <BotaoDoParto
                      key={parto.id}
                      ordem={parto.ordem}
                      ativo={escolha.idCasal === casal.id && parto.ordem === partoAtivo}
                      aoEscolher={() => setEscolhido({ idCasal: casal.id, ordem: parto.ordem })}
                    />
                  ))}
                </div>
              ))}

              <Tabs
                items={[
                  {
                    key: 'reproducao',
                    label: 'Reprodução',
                    children: (
                      <AbaReproducao
                        ficha={deCasal}
                        ordem={partoAtivo}
                        parto={partoDaOrdem(vista, partoAtivo)}
                        casalDeAntes={anterior?.casal ?? null}
                      />
                    ),
                  },
                  {
                    key: 'ninhada',
                    label: 'Ninhada',
                    // remonta a cada parto escolhido: o formulário aberto é do parto que estava na tela
                    children: <AbaNinhada key={`${escolha.idCasal ?? 'atual'}-${partoAtivo}`} ficha={vista} ordem={partoAtivo} />,
                  },
                  { key: 'eventos', label: 'Eventos', children: <AbaEventos ficha={deCasal} /> },
                ]}
              />
            </>
          )}
        </EstadoDaConsulta>
      )}
    </Modal>
  )
}

/** O parto escolhido no seletor: do casal da caixa (idCasal null) ou de um casal de antes */
interface Escolha {
  idCasal: number | null
  ordem: number
}

/** O parto que já nasceu e ainda não desmamou: é nele que o técnico registra seleção e desmame */
function emAndamento(partos: Parto[]): Parto | undefined {
  return [...partos].reverse().find((parto) => parto.dtPartoReal !== null && parto.dtDesmameReal === null)
}

/**
 * Onde o seletor abre: no parto em andamento do casal da caixa, senão no de um casal de antes
 * que deixou ninhada nela, senão no parto mais recente
 */
function escolhaInicial(ficha: Ficha | undefined): Escolha {
  const doCasal = emAndamento(ficha?.partos ?? [])
  if (doCasal) return { idCasal: null, ordem: doCasal.ordem }

  for (const { casal, partos } of ficha?.anteriores ?? []) {
    const deAntes = emAndamento(partos)
    if (deAntes) return { idCasal: casal.id, ordem: deAntes.ordem }
  }

  return { idCasal: null, ordem: ficha?.partos.at(-1)?.ordem ?? 1 }
}

function BotaoDoParto({ ordem, ativo, aoEscolher }: { ordem: number; ativo: boolean; aoEscolher: () => void }) {
  const { cor, frente } = corDoParto(ordem)

  return (
    <button
      type="button"
      className="ficha__parto"
      style={ativo ? { backgroundColor: cor, borderColor: cor, color: frente } : { borderLeftColor: cor, borderLeftWidth: 4 }}
      onClick={aoEscolher}
    >
      {ordem}º
    </button>
  )
}

function partoDaOrdem(ficha: Ficha, ordem: number): Parto | undefined {
  return ficha.partos.find((parto) => parto.ordem === ordem)
}

function ProximoAcasalamento({ ficha, ordem }: { ficha: Ficha; ordem: number }) {
  const { casal } = ficha
  const ultimo = ficha.partos.at(-1)
  const seguinte = (ultimo?.ordem ?? 0) + 1

  if (!casal?.ativo) {
    return <p className="ficha__vazio">O {ordem}º parto não aconteceu: o casal está encerrado.</p>
  }

  if (ultimo && ultimo.dtPartoReal === null) {
    return (
      <p className="ficha__vazio">
        Registre o {ultimo.ordem}º parto antes do acasalamento seguinte.
      </p>
    )
  }

  if (ordem !== seguinte) {
    return <p className="ficha__vazio">Registre antes o acasalamento do {seguinte}º parto.</p>
  }

  return (
    <RegistrarEvento
      idCaixa={ficha.caixa.id}
      caminho={`/api/casais/${casal.id}/acasalamento`}
      campos={[
        { nome: 'dtAcasalamento', rotulo: 'Data do acasalamento', tipo: 'data', desde: [ultimo?.dtPartoReal] },
      ]}
      inicial={{ dtAcasalamento: hoje() }}
      botao="Registrar acasalamento"
    />
  )
}

function AbaReproducao({
  ficha,
  ordem,
  parto,
  casalDeAntes,
}: {
  ficha: Ficha
  ordem: number
  parto: Parto | undefined
  /** o parto escolhido é de um casal que veio antes do da caixa */
  casalDeAntes: Casal | null
}) {
  const { caixa, casal } = ficha
  const confirmados = ficha.partos.filter((p) => p.dtPartoReal !== null).length
  // as ninhadas que ainda estão dentro da caixa, deste casal ou de um de antes
  const naCaixa = [...ficha.partos, ...ficha.anteriores.flatMap((a) => a.partos)].filter(
    (p) => p.naCaixa.m + p.naCaixa.f > 0,
  )
  const ocupada =
    naCaixa.length === 0
      ? null
      : naCaixa.some((p) => p.desmamadoM === null)
        ? 'A ninhada ainda mama nesta caixa. Casal novo entra depois do desmame, com os desmamados no estoque.'
        : 'A caixa ainda tem desmamados. Casal novo entra depois que eles forem para o estoque, na aba Ninhada.'

  return (
    <div className="ficha__aba">
      <LadoALado>
        <Campo rotulo="Espécie">{ROTULO_ESPECIE[caixa.especie]}</Campo>
        <Campo rotulo="Linhagem">{caixa.linhagem ?? '—'}</Campo>
      </LadoALado>

      <h3>Casal</h3>
      {/*
       * Cada dado uma vez: a identificação (AB) é o macho e a fêmea juntos, e a data de formação
       * é o acasalamento do 1º parto, na seção do parto
       */}
      {casal && (
        <>
          {!casal.ativo && (
            <div className="ficha__casal">Casal encerrado em {formatarData(casal.dtEncerramento)}</div>
          )}
          {casal.ativo && confirmados >= MAX_PARTOS_POR_CASAL - 1 && (
            <Etiqueta tom="atencao">Último parto: o casal encerra sozinho no {MAX_PARTOS_POR_CASAL}º</Etiqueta>
          )}
          <LadoALado>
            <Campo rotulo="Macho (A-E)">{casal.grupoMacho}</Campo>
            <Campo rotulo="Fêmea (A-E)">{casal.grupoFemea}</Campo>
            <Campo rotulo="Partos">
              {confirmados}/{MAX_PARTOS_POR_CASAL}
            </Campo>
          </LadoALado>
        </>
      )}
      {casal?.ativo ? (
        <EncerrarCasal
          idCaixa={caixa.id}
          idCasal={casal.id}
          desde={maisTarde(casal.dtFormacao, ficha.partos.at(-1)?.dtAcasalamento)}
        />
      ) : ocupada ? (
        <p className="ficha__vazio">{ocupada}</p>
      ) : (
        <FormarCasal alvo={{ idCaixa: caixa.id }} especie={caixa.especie} />
      )}
      {ficha.virarEstoque && (
        <VirarCaixaDeEstoque
          idCaixa={caixa.id}
          sexo={ficha.virarEstoque}
          total={naCaixa.reduce((soma, p) => soma + (ficha.virarEstoque === 'M' ? p.naCaixa.m : p.naCaixa.f), 0)}
        />
      )}

      <h3>
        <span className="bolinhaDeParto" style={{ backgroundColor: corDoParto(ordem).cor }} /> {ordem}º parto
        {casalDeAntes && ` do casal ${casalDeAntes.identificacao}`}
      </h3>
      {/* as previsões vêm da API: parto = acasalamento + 23 dias, desmame = parto + 22 dias */}
      {parto ? (
        <LadoALado>
          <Campo rotulo="Acasalamento" destaque>
            {formatarData(parto.dtAcasalamento)}
          </Campo>
          <Campo rotulo="Parto previsto" destaque>
            {formatarData(parto.dtPartoPrevisto)}
          </Campo>
          <Campo rotulo="Desmame previsto" destaque>
            {formatarData(parto.dtDesmamePrevisto)}
          </Campo>
        </LadoALado>
      ) : (
        <ProximoAcasalamento ficha={ficha} ordem={ordem} />
      )}
    </div>
  )
}

const GRUPOS = ['A', 'B', 'C', 'D', 'E'].map((grupo) => ({ value: grupo, label: grupo }))

interface CamposDoCasal {
  idLinhagem: number
  grupoMacho: string
  grupoFemea: string
  dtFormacao: string
}

/** Onde a API pode apontar erro na formação do casal */
const CAMPOS_DO_CASAL: (keyof CamposDoCasal)[] = ['idLinhagem', 'grupoMacho', 'grupoFemea', 'dtFormacao']

function FormarCasal({
  alvo,
  especie,
  aoFormar,
}: {
  alvo: Pick<CasalNovo, 'idCaixa' | 'posicao'>
  /** null = posição vazia: qualquer linhagem, e a espécie da caixa sai dela */
  especie: CodigoEspecie | null
  aoFormar?: (idCaixa: number) => void
}) {
  const { message } = App.useApp()
  const catalogo = useCatalogo()
  const formar = useFormarCasal()
  const [form] = Form.useForm<CamposDoCasal>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DO_CASAL)

  const especies = (catalogo.data?.especies ?? []).filter((e) => especie === null || e.codigo === especie)
  const linhagens = especies.map((e) => ({
    label: e.nome,
    options: e.linhagens.filter((l) => l.ativa).map((l) => ({ value: l.id, label: l.nome })),
  }))

  // cruzamento rotacional: cada macho tem uma fêmea certa (AB, BC, CD, DE, EA)
  function escolherMacho(grupoMacho: string) {
    const par = catalogo.data?.paresGeneticos.find((p) => p.grupoMacho === grupoMacho)
    if (par) form.setFieldValue('grupoFemea', par.grupoFemea)
  }

  function salvar(campos: CamposDoCasal) {
    falha.limpar()
    formar.mutate(
      { ...alvo, ...campos },
      {
        onSuccess: ({ idCaixa }) => {
          void message.success(`Casal ${campos.grupoMacho}${campos.grupoFemea} formado.`)
          aoFormar?.(idCaixa)
        },
        onError: falha.mostrar,
      },
    )
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={salvar}
      initialValues={{ dtFormacao: hoje() }}
      className="ficha__formulario"
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <Form.Item name="idLinhagem" label="Linhagem" rules={[{ required: true, message: 'Escolha a linhagem' }]}>
        <Select options={linhagens} loading={catalogo.isPending} placeholder="Selecione a linhagem" />
      </Form.Item>
      <LadoALado>
        <Form.Item name="grupoMacho" label="Macho (A-E)" rules={[{ required: true, message: 'Grupo do macho' }]}>
          <Select options={GRUPOS} onChange={escolherMacho} />
        </Form.Item>
        <Form.Item name="grupoFemea" label="Fêmea (A-E)" rules={[{ required: true, message: 'Grupo da fêmea' }]}>
          <Select options={GRUPOS} />
        </Form.Item>
        <Form.Item name="dtFormacao" label="Acasalamento" rules={[{ required: true, message: 'Data' }]}>
          <CampoDeData max={hoje()} />
        </Form.Item>
      </LadoALado>
      <Botao variante="primario" htmlType="submit" loading={formar.isPending}>
        Formar casal
      </Botao>
    </Form>
  )
}

interface CamposDoEncerramento {
  dtEncerramento: string
  motivo: string
}

function EncerrarCasal({
  idCaixa,
  idCasal,
  desde,
}: {
  idCaixa: number
  idCasal: number
  /** o primeiro dia possível: a formação ou o último acasalamento, o que vier depois */
  desde: DataISO | undefined
}) {
  const { message } = App.useApp()
  const registrar = useRegistrarNaFicha(idCaixa)
  const [aberto, setAberto] = useState(false)
  const [form] = Form.useForm<CamposDoEncerramento>()
  const falha = useFalhaDoFormulario(form, ['dtEncerramento', 'motivo'])

  if (!aberto) {
    return (
      <div>
        <Botao onClick={() => setAberto(true)}>Encerrar casal</Botao>
      </div>
    )
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ dtEncerramento: hoje() }}
      className="ficha__formulario"
      onFinish={(corpo: CamposDoEncerramento) => {
        falha.limpar()
        registrar.mutate(
          { caminho: `/api/casais/${idCasal}/encerramento`, corpo },
          {
            onSuccess: () => {
              void message.success('Casal encerrado.')
              setAberto(false)
            },
            onError: falha.mostrar,
          },
        )
      }}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        <Form.Item name="dtEncerramento" label="Data" rules={[{ required: true, message: 'Data' }]}>
          <CampoDeData min={desde} max={hoje()} />
        </Form.Item>
        <Form.Item name="motivo" label="Motivo" rules={[{ required: true, message: 'Diga o motivo' }]}>
          <Input placeholder="ex: queda de produtividade" maxLength={200} />
        </Form.Item>
      </LadoALado>
      <div className="ficha__botoes">
        <Botao variante="perigo" htmlType="submit" loading={registrar.isPending}>
          Encerrar
        </Botao>
        <Botao variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}

interface CampoDoEvento {
  nome: string
  rotulo: string
  tipo: 'data' | 'numero'
  /** data: os eventos de que ela depende; não pode ser antes de nenhum (no mesmo dia pode) */
  desde?: (DataISO | null | undefined)[]
  /** data: os eventos que vêm depois dela; não pode passar de nenhum, nem de hoje */
  ate?: (DataISO | null | undefined)[]
}

const existentes = (datas: (DataISO | null | undefined)[]) => datas.filter((data): data is DataISO => Boolean(data))

/** O dia mais tarde entre os que existem: o primeiro que a data pode ter */
function maisTarde(...datas: (DataISO | null | undefined)[]): DataISO | undefined {
  return existentes(datas).sort().at(-1)
}

/** O dia mais cedo entre hoje e os que existem: o último que a data pode ter */
function ateHoje(...datas: (DataISO | null | undefined)[]): DataISO {
  return [hoje(), ...existentes(datas)].sort()[0] ?? hoje()
}

/** O campo de data de um evento, com os dias fora da ordem apagados no calendário */
function DataDoEvento({
  campo,
  ...resto
}: { campo: CampoDoEvento } & Omit<ComponentProps<typeof CampoDeData>, 'min' | 'max'>) {
  return <CampoDeData {...resto} min={maisTarde(...(campo.desde ?? []))} max={ateHoje(...(campo.ate ?? []))} />
}

/** Formulário de um registro do parto: nascimento, eutanásia de seleção ou desmame */
function RegistrarEvento({
  idCaixa,
  caminho,
  campos,
  inicial,
  botao,
  extra = {},
}: {
  idCaixa: number
  caminho: string
  campos: CampoDoEvento[]
  inicial: Record<string, unknown>
  botao: string
  extra?: Record<string, unknown>
}) {
  const { message, modal } = App.useApp()
  const registrar = useRegistrarNaFicha(idCaixa)
  const [form] = Form.useForm<Record<string, unknown>>()
  const falha = useFalhaDoFormulario(
    form,
    campos.map((campo) => campo.nome),
  )

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={inicial}
      className="ficha__formulario"
      onFinish={(valores: Record<string, unknown>) => {
        falha.limpar()
        registrar.mutate(
          { caminho, corpo: { ...valores, ...extra } },
          {
            onSuccess: ({ falta }) => {
              void message.success('Registrado.')
              // grava o que aconteceu, mesmo abaixo do reservado, e avisa
              if (falta) modal.warning({ title: 'Reserva em falta', content: descreverFalta(falta) })
            },
            onError: falha.mostrar,
          },
        )
      }}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        {campos.map((campo) => (
          <Form.Item
            key={campo.nome}
            name={campo.nome}
            label={campo.rotulo}
            rules={[{ required: true, message: 'Obrigatório' }]}
          >
            {campo.tipo === 'data' ? <DataDoEvento campo={campo} /> : <InputNumber min={0} max={999} style={{ width: '100%' }} />}
          </Form.Item>
        ))}
      </LadoALado>
      <Botao variante="primario" htmlType="submit" loading={registrar.isPending}>
        {botao}
      </Botao>
    </Form>
  )
}

function CorrigirEvento({
  idCaixa,
  idParto,
  evento,
  campos,
  atual,
}: {
  idCaixa: number
  idParto: number
  evento: EventoCorrigivel
  campos: CampoDoEvento[]
  atual: Record<string, unknown>
}) {
  const { message, modal } = App.useApp()
  const corrigir = useCorrigirEvento(idCaixa)
  const [aberto, setAberto] = useState(false)
  const [form] = Form.useForm<Record<string, unknown>>()
  const falha = useFalhaDoFormulario(form, [...campos.map((campo) => campo.nome), 'motivo'])

  if (!aberto) {
    return (
      <div>
        <Botao variante="fantasma" onClick={() => setAberto(true)}>
          Corrigir
        </Botao>
      </div>
    )
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={atual}
      className="ficha__formulario"
      onFinish={(corpo: Record<string, unknown>) => {
        falha.limpar()
        corrigir.mutate(
          { idParto, evento, corpo },
          {
            onSuccess: ({ parto }) => {
              void message.success('Correção registrada.')
              // grava o que aconteceu, mesmo abaixo do reservado, e avisa
              if (parto.falta) modal.warning({ title: 'Reserva em falta', content: descreverFalta(parto.falta) })
              setAberto(false)
            },
            onError: falha.mostrar,
          },
        )
      }}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        {campos.map((campo) => (
          <Form.Item
            key={campo.nome}
            name={campo.nome}
            label={campo.rotulo}
            rules={[{ required: true, message: 'Obrigatório' }]}
          >
            {campo.tipo === 'data' ? <DataDoEvento campo={campo} /> : <InputNumber min={0} max={999} style={{ width: '100%' }} />}
          </Form.Item>
        ))}
      </LadoALado>
      <Form.Item
        name="motivo"
        label="Motivo da correção"
        rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
      >
        <Input placeholder="ex: contagem digitada errada" maxLength={200} />
      </Form.Item>
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={corrigir.isPending}>
          Salvar correção
        </Botao>
        <Botao variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}

/** A ninhada ficou com menos animais do que o reservado: o aviso fica enquanto a reserva passar */
function ReservaEmFalta({ parto }: { parto: Parto }) {
  if (!parto.falta) return null

  return (
    <Aviso tom="atencao" titulo="Reserva em falta">
      {descreverFalta(parto.falta)}
    </Aviso>
  )
}

function AbaNinhada({ ficha, ordem }: { ficha: Ficha; ordem: number }) {
  const parto = partoDaOrdem(ficha, ordem)

  if (!parto) {
    return (
      <div className="ficha__aba">
        <ProximoAcasalamento ficha={ficha} ordem={ordem} />
      </div>
    )
  }

  const idCaixa = ficha.caixa.id
  // o acasalamento do parto seguinte limita a correção da data deste parto
  const seguinte = partoDaOrdem(ficha, ordem + 1)
  const nasceu = parto.dtPartoReal !== null
  const nascidos = (parto.nascidoM ?? 0) + (parto.nascidoF ?? 0)
  const restantesM = (parto.nascidoM ?? 0) - (parto.eutanasiadoM ?? 0)
  const restantesF = (parto.nascidoF ?? 0) - (parto.eutanasiadoF ?? 0)
  const desmamados = (parto.desmamadoM ?? 0) + (parto.desmamadoF ?? 0)

  return (
    <div className="ficha__aba">
      <ReservaEmFalta parto={parto} />
      <Campo rotulo="Acasalamento">{formatarData(parto.dtAcasalamento)}</Campo>

      <h3>Parto</h3>
      {nasceu ? (
        <>
          <LadoALado>
            <Campo rotulo="Data do parto">{formatarData(parto.dtPartoReal)}</Campo>
            <Campo rotulo="Idade hoje">
              {parto.dtPartoReal ? descreverDias(idadeEmDias(parto.dtPartoReal)) : '—'}
            </Campo>
          </LadoALado>
          <LadoALado>
            <Campo rotulo="Machos nascidos">{parto.nascidoM ?? '—'}</Campo>
            <Campo rotulo="Fêmeas nascidas">{parto.nascidoF ?? '—'}</Campo>
          </LadoALado>
          <Total>
            Total nascidos: <strong>{nascidos}</strong>
          </Total>
          <CorrigirEvento
            idCaixa={idCaixa}
            idParto={parto.id}
            evento="nascimento"
            campos={[
              {
                nome: 'dtPartoReal',
                rotulo: 'Data do parto',
                tipo: 'data',
                desde: [parto.dtAcasalamento],
                ate: [parto.dtSelecao, parto.dtDesmameReal, seguinte?.dtAcasalamento],
              },
              { nome: 'nascidoM', rotulo: 'Machos nascidos', tipo: 'numero' },
              { nome: 'nascidoF', rotulo: 'Fêmeas nascidas', tipo: 'numero' },
            ]}
            atual={{ dtPartoReal: parto.dtPartoReal, nascidoM: parto.nascidoM, nascidoF: parto.nascidoF }}
          />
        </>
      ) : ficha.casal?.ativo ? (
        <RegistrarEvento
          idCaixa={idCaixa}
          caminho={`/api/partos/${parto.id}/nascimento`}
          campos={[
            { nome: 'dtPartoReal', rotulo: 'Data do parto', tipo: 'data', desde: [parto.dtAcasalamento] },
            { nome: 'nascidoM', rotulo: 'Machos nascidos', tipo: 'numero' },
            { nome: 'nascidoF', rotulo: 'Fêmeas nascidas', tipo: 'numero' },
          ]}
          inicial={{ dtPartoReal: hoje() }}
          botao="Registrar parto"
        />
      ) : (
        <p className="ficha__vazio">Parto não registrado.</p>
      )}

      <h3>Eutanásia de seleção</h3>
      {parto.dtSelecao ? (
        <>
          <LadoALado>
            <Campo rotulo="Machos">{parto.eutanasiadoM ?? '—'}</Campo>
            <Campo rotulo="Fêmeas">{parto.eutanasiadoF ?? '—'}</Campo>
          </LadoALado>
          <Total>
            Resultantes: <strong>{restantesM + restantesF}</strong>
          </Total>
          <CorrigirEvento
            idCaixa={idCaixa}
            idParto={parto.id}
            evento="selecao"
            campos={[
              { nome: 'dtSelecao', rotulo: 'Data', tipo: 'data', desde: [parto.dtPartoReal], ate: [parto.dtDesmameReal] },
              { nome: 'eutanasiadoM', rotulo: 'Machos', tipo: 'numero' },
              { nome: 'eutanasiadoF', rotulo: 'Fêmeas', tipo: 'numero' },
            ]}
            atual={{ dtSelecao: parto.dtSelecao, eutanasiadoM: parto.eutanasiadoM, eutanasiadoF: parto.eutanasiadoF }}
          />
        </>
      ) : nasceu ? (
        <RegistrarEvento
          idCaixa={idCaixa}
          caminho={`/api/partos/${parto.id}/selecao`}
          campos={[
            { nome: 'dtSelecao', rotulo: 'Data', tipo: 'data', desde: [parto.dtPartoReal] },
            { nome: 'eutanasiadoM', rotulo: 'Machos', tipo: 'numero' },
            { nome: 'eutanasiadoF', rotulo: 'Fêmeas', tipo: 'numero' },
          ]}
          inicial={{ dtSelecao: parto.dtPartoReal, eutanasiadoM: 0, eutanasiadoF: 0 }}
          botao="Registrar eutanásia"
        />
      ) : (
        <p className="ficha__vazio">Feita no dia do parto.</p>
      )}

      <h3>Desmame</h3>
      {parto.dtDesmameReal ? (
        <>
          <Campo rotulo="Data do desmame real">{formatarData(parto.dtDesmameReal)}</Campo>
          <LadoALado>
            <Campo rotulo="Machos desmamados">{parto.desmamadoM ?? '—'}</Campo>
            <Campo rotulo="Fêmeas desmamadas">{parto.desmamadoF ?? '—'}</Campo>
          </LadoALado>
          <Total>
            Desmame total: <strong>{desmamados}</strong> animais
          </Total>
          <CorrigirEvento
            idCaixa={idCaixa}
            idParto={parto.id}
            evento="desmame"
            campos={[
              {
                nome: 'dtDesmameReal',
                rotulo: 'Data do desmame',
                tipo: 'data',
                desde: [parto.dtPartoReal, parto.dtSelecao],
              },
              { nome: 'desmamadoM', rotulo: 'Machos desmamados', tipo: 'numero' },
              { nome: 'desmamadoF', rotulo: 'Fêmeas desmamadas', tipo: 'numero' },
            ]}
            atual={{ dtDesmameReal: parto.dtDesmameReal, desmamadoM: parto.desmamadoM, desmamadoF: parto.desmamadoF }}
          />
          <DesmamadosDoParto
            idCaixa={idCaixa}
            caixa={ficha.caixa}
            linhagem={ficha.casal?.linhagem ?? ficha.caixa.linhagem}
            parto={parto}
          />
        </>
      ) : nasceu ? (
        <RegistrarEvento
          // remonta quando a seleção chega, para a sugestão já descontar os eutanasiados
          key={parto.dtSelecao ?? 'sem-selecao'}
          idCaixa={idCaixa}
          caminho={`/api/partos/${parto.id}/desmame`}
          campos={[
            {
              nome: 'dtDesmameReal',
              rotulo: 'Data do desmame',
              tipo: 'data',
              desde: [parto.dtPartoReal, parto.dtSelecao],
            },
            { nome: 'desmamadoM', rotulo: 'Machos desmamados', tipo: 'numero' },
            { nome: 'desmamadoF', rotulo: 'Fêmeas desmamadas', tipo: 'numero' },
          ]}
          inicial={{
            dtDesmameReal: hoje(),
            desmamadoM: Math.max(restantesM, 0),
            desmamadoF: Math.max(restantesF, 0),
          }}
          extra={{ idCaixaRecria: null }}
          botao="Registrar desmame"
        />
      ) : null}
    </div>
  )
}

function AbaEventos({ ficha }: { ficha: Ficha }) {
  if (ficha.eventos.length === 0) {
    return <p className="ficha__vazio">Nenhum evento registrado.</p>
  }

  return (
    <ul className="ficha__eventos">
      {ficha.eventos.map((evento, indice) => (
        <li key={`${indice}-${evento.dataHora}-${evento.tipo}`} className="ficha__evento">
          <span className="ficha__eventoData">{formatarData(evento.dataHora.slice(0, 10))}</span>
          <span className="ficha__eventoTexto">{evento.descricao}</span>
          <span className="ficha__eventoAutor">{evento.autor}</span>
        </li>
      ))}
    </ul>
  )
}
