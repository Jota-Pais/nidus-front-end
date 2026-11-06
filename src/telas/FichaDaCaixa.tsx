import { App, Form, Input, InputNumber, Modal, Select, Tabs } from 'antd'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Aviso, Botao, Etiqueta, Linha, Texto } from '@/componentes'
import { COR_DO_PARTO } from '@/app/tokens'
import { corDoParto, MAX_PARTOS_POR_CASAL } from '@/dominio/caixa'
import {
  useCatalogo,
  useCorrigirEvento,
  useEstantes,
  useFicha,
  useFormarCasal,
  useGrade,
  useMudarDePosicao,
  useRegistrarNaFicha,
} from '@/dominio/consultas'
import type { CasalNovo, EventoCorrigivel } from '@/dominio/consultas'
import type { CodigoEspecie, Ficha, Parto } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { motivoDaFalha, useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { descreverDias, formatarData, hoje, idadeEmDias } from '@/lib/data'
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
  const [escolhido, setEscolhido] = useState<number | null>(null)

  const partoAtivo = escolhido ?? partoEmAndamento(ficha.data?.partos ?? [])
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
          background: corDoParto(partoAtivo).fundo,
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
          {ficha.data && (
            <>
              <div className="ficha__partos">
                <Texto tom="rotulo">Parto</Texto>
                {COR_DO_PARTO.map(({ cor, frente }, indice) => {
                  const ordem = indice + 1
                  const ativo = ordem === partoAtivo
                  return (
                    <button
                      key={cor}
                      type="button"
                      className="ficha__parto"
                      style={
                        ativo
                          ? { backgroundColor: cor, borderColor: cor, color: frente }
                          : { borderLeftColor: cor, borderLeftWidth: 4 }
                      }
                      onClick={() => setEscolhido(ordem)}
                    >
                      {ordem}º
                    </button>
                  )
                })}
              </div>

              <Tabs
                items={[
                  { key: 'reproducao', label: 'Reprodução', children: <AbaReproducao ficha={ficha.data} ordem={partoAtivo} /> },
                  { key: 'ninhada', label: 'Ninhada', children: <AbaNinhada ficha={ficha.data} ordem={partoAtivo} /> },
                  { key: 'agrupamento', label: 'Agrupamento', children: <AbaAgrupamento ficha={ficha.data} ordem={partoAtivo} /> },
                  { key: 'eventos', label: 'Eventos', children: <AbaEventos ficha={ficha.data} /> },
                ]}
              />
            </>
          )}
        </EstadoDaConsulta>
      )}
    </Modal>
  )
}

function Campo({ rotulo, children, destaque = false }: { rotulo: string; children: ReactNode; destaque?: boolean }) {
  return (
    <div className="ficha__campo">
      <Texto tom="rotulo">{rotulo}</Texto>
      <span className={`ficha__valor${destaque ? ' ficha__valor--destaque' : ''}`}>{children}</span>
    </div>
  )
}

/** dois ou três campos lado a lado */
function LadoALado({ children }: { children: ReactNode }) {
  return <div className="ficha__linha">{children}</div>
}

function Total({ children }: { children: ReactNode }) {
  return <div className="ficha__total">{children}</div>
}

/**
 * Onde o seletor abre: no parto que já nasceu e ainda não desmamou (é nele que o técnico
 * registra seleção e desmame), senão no mais recente
 */
function partoEmAndamento(partos: Parto[]): number {
  const pendente = [...partos]
    .reverse()
    .find((parto) => parto.dtPartoReal !== null && parto.dtDesmameReal === null)
  return pendente?.ordem ?? partos.at(-1)?.ordem ?? 1
}

function partoDaOrdem(ficha: Ficha, ordem: number): Parto | undefined {
  return ficha.partos.find((parto) => parto.ordem === ordem)
}

/** O que mostrar no lugar de uma data que ainda não existe */
function aguardando(ordem: number): string {
  return ordem === 1 ? 'Informe o acasalamento' : 'Parto real anterior + 6 dias'
}

function AbaReproducao({ ficha, ordem }: { ficha: Ficha; ordem: number }) {
  const { caixa, casal } = ficha
  const parto = partoDaOrdem(ficha, ordem)
  const confirmados = ficha.partos.filter((p) => p.dtPartoReal !== null).length

  return (
    <div className="ficha__aba">
      <MoverDePosicao idCaixa={caixa.id} />
      <LadoALado>
        <Campo rotulo="Espécie">{ROTULO_ESPECIE[caixa.especie]}</Campo>
        <Campo rotulo="Linhagem">{caixa.linhagem ?? '—'}</Campo>
      </LadoALado>

      <h3>Casal</h3>
      {casal && (
        <>
          <div className="ficha__casal">
            <strong>{casal.identificacao}</strong> — {confirmados}/{MAX_PARTOS_POR_CASAL} partos |
            Acasalamento: {formatarData(casal.dtFormacao)}
            {!casal.ativo && ` | Encerrado em ${formatarData(casal.dtEncerramento)}`}
          </div>
          {casal.ativo && confirmados >= MAX_PARTOS_POR_CASAL - 1 && (
            <Etiqueta tom="atencao">Último parto: o casal encerra sozinho no {MAX_PARTOS_POR_CASAL}º</Etiqueta>
          )}
          <LadoALado>
            <Campo rotulo="Macho (A-E)">{casal.grupoMacho}</Campo>
            <Campo rotulo="Fêmea (A-E)">{casal.grupoFemea}</Campo>
          </LadoALado>
        </>
      )}
      {casal?.ativo ? (
        <EncerrarCasal idCaixa={caixa.id} idCasal={casal.id} />
      ) : (
        <FormarCasal alvo={{ idCaixa: caixa.id }} especie={caixa.especie} />
      )}

      <h3>
        Datas previstas — <span className="bolinhaDeParto" style={{ backgroundColor: corDoParto(ordem).cor }} />{' '}
        {ordem}º parto
      </h3>
      <LadoALado>
        <Campo rotulo="Acasalamento" destaque={!!parto}>
          {parto ? formatarData(parto.dtAcasalamento) : aguardando(ordem)}
        </Campo>
        <Campo rotulo="Parto previsto" destaque={!!parto}>
          {parto ? formatarData(parto.dtPartoPrevisto) : '+23 dias após o acasalamento'}
        </Campo>
      </LadoALado>
      <Campo rotulo="Desmame previsto" destaque={!!parto}>
        {parto ? formatarData(parto.dtDesmamePrevisto) : '+22 dias após o parto'}
      </Campo>
    </div>
  )
}

function MoverDePosicao({ idCaixa }: { idCaixa: number }) {
  const { message } = App.useApp()
  const estantes = useEstantes()
  const mover = useMudarDePosicao()
  const [aberto, setAberto] = useState(false)
  const [idEstante, setIdEstante] = useState<number | null>(null)
  const [posicao, setPosicao] = useState<string | null>(null)

  if (!aberto) {
    return (
      <div>
        <Botao onClick={() => setAberto(true)}>Mover de posição</Botao>
      </div>
    )
  }

  function fechar() {
    setAberto(false)
    setIdEstante(null)
    setPosicao(null)
  }

  function salvar() {
    if (idEstante === null || posicao === null) return
    const [face, linha, coluna] = posicao.split(':')

    mover.mutate(
      {
        idCaixa,
        idEstante,
        face: face === 'traseira' ? 'traseira' : 'frontal',
        linha: Number(linha),
        coluna: Number(coluna),
      },
      {
        onSuccess: ({ codigo }) => {
          void message.success(`Caixa movida para ${codigo}.`)
          fechar()
        },
        // sem campo para destacar: o motivo vai no aviso
        onError: (erro) => void message.error(motivoDaFalha(erro)),
      },
    )
  }

  return (
    <div className="ficha__formulario">
      <LadoALado>
        <div className="ficha__campo">
          <Texto tom="rotulo">Estante</Texto>
          <Select
            value={idEstante}
            loading={estantes.isPending}
            placeholder="Selecione a estante"
            options={(estantes.data ?? []).map((estante) => ({
              value: estante.id,
              label: `${estante.sala} · ${estante.numeroVisivel}`,
            }))}
            onChange={(id) => {
              setIdEstante(id)
              setPosicao(null)
            }}
          />
        </div>
        <div className="ficha__campo">
          <Texto tom="rotulo">Posição livre</Texto>
          {idEstante === null ? (
            <Select disabled placeholder="Escolha a estante" />
          ) : (
            <PosicoesLivres idEstante={idEstante} valor={posicao} aoEscolher={setPosicao} />
          )}
        </div>
      </LadoALado>
      <div className="ficha__botoes">
        <Botao variante="primario" onClick={salvar} loading={mover.isPending} disabled={posicao === null}>
          Mover
        </Botao>
        <Botao variante="fantasma" onClick={fechar}>
          Cancelar
        </Botao>
      </div>
    </div>
  )
}

function PosicoesLivres({
  idEstante,
  valor,
  aoEscolher,
}: {
  idEstante: number
  valor: string | null
  aoEscolher: (posicao: string) => void
}) {
  const grade = useGrade(idEstante)
  const livres = (grade.data?.faces ?? []).flatMap((face) =>
    face.posicoes
      .filter((posicao) => posicao.caixa === null)
      .map((posicao) => ({ value: `${face.face}:${posicao.linha}:${posicao.coluna}`, label: posicao.codigo })),
  )

  return (
    <Select
      value={valor}
      loading={grade.isPending}
      placeholder={grade.isPending || livres.length > 0 ? 'Selecione a posição' : 'Estante cheia'}
      disabled={!grade.isPending && livres.length === 0}
      showSearch
      options={livres}
      onChange={aoEscolher}
    />
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
          <Input type="date" />
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

function EncerrarCasal({ idCaixa, idCasal }: { idCaixa: number; idCasal: number }) {
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
          <Input type="date" />
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
  const { message } = App.useApp()
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
            onSuccess: () => void message.success('Registrado.'),
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
            {campo.tipo === 'data' ? <Input type="date" /> : <InputNumber min={0} style={{ width: '100%' }} />}
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
            onSuccess: ({ alerta }) => {
              void message.success('Correção registrada.')
              if (alerta) modal.warning({ title: 'Confira os compromissos', content: alerta })
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
            {campo.tipo === 'data' ? <Input type="date" /> : <InputNumber min={0} style={{ width: '100%' }} />}
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

function AbaNinhada({ ficha, ordem }: { ficha: Ficha; ordem: number }) {
  const parto = partoDaOrdem(ficha, ordem)

  if (!parto) {
    return <p className="ficha__vazio">O {ordem}º parto ainda não começou. {aguardando(ordem)}.</p>
  }

  const idCaixa = ficha.caixa.id
  const nasceu = parto.dtPartoReal !== null
  const nascidos = (parto.nascidoM ?? 0) + (parto.nascidoF ?? 0)
  const restantesM = (parto.nascidoM ?? 0) - (parto.eutanasiadoM ?? 0)
  const restantesF = (parto.nascidoF ?? 0) - (parto.eutanasiadoF ?? 0)
  const desmamados = (parto.desmamadoM ?? 0) + (parto.desmamadoF ?? 0)

  return (
    <div className="ficha__aba">
      <LadoALado>
        <Campo rotulo="Acasalamento">{formatarData(parto.dtAcasalamento)}</Campo>
        <Campo rotulo="Previsão de parto">{formatarData(parto.dtPartoPrevisto)}</Campo>
      </LadoALado>

      <h3>Parto</h3>
      {nasceu ? (
        <>
          <LadoALado>
            <Campo rotulo="Data do parto real">{formatarData(parto.dtPartoReal)}</Campo>
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
              { nome: 'dtPartoReal', rotulo: 'Data do parto real', tipo: 'data' },
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
            { nome: 'dtPartoReal', rotulo: 'Data do parto real', tipo: 'data' },
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
              { nome: 'dtSelecao', rotulo: 'Data', tipo: 'data' },
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
            { nome: 'dtSelecao', rotulo: 'Data', tipo: 'data' },
            { nome: 'eutanasiadoM', rotulo: 'Machos', tipo: 'numero' },
            { nome: 'eutanasiadoF', rotulo: 'Fêmeas', tipo: 'numero' },
          ]}
          inicial={{ dtSelecao: parto.dtPartoReal, eutanasiadoM: 0, eutanasiadoF: 0 }}
          botao="Registrar seleção"
        />
      ) : (
        <p className="ficha__vazio">Feita no dia do parto real.</p>
      )}

      <h3>Desmame</h3>
      <Campo rotulo="Previsão de desmame">{formatarData(parto.dtDesmamePrevisto)}</Campo>
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
              { nome: 'dtDesmameReal', rotulo: 'Data do desmame', tipo: 'data' },
              { nome: 'desmamadoM', rotulo: 'Machos desmamados', tipo: 'numero' },
              { nome: 'desmamadoF', rotulo: 'Fêmeas desmamadas', tipo: 'numero' },
            ]}
            atual={{ dtDesmameReal: parto.dtDesmameReal, desmamadoM: parto.desmamadoM, desmamadoF: parto.desmamadoF }}
          />
        </>
      ) : nasceu ? (
        <RegistrarEvento
          // remonta quando a seleção chega, para a sugestão já descontar os eutanasiados
          key={parto.dtSelecao ?? 'sem-selecao'}
          idCaixa={idCaixa}
          caminho={`/api/partos/${parto.id}/desmame`}
          campos={[
            { nome: 'dtDesmameReal', rotulo: 'Data do desmame', tipo: 'data' },
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

function AbaAgrupamento({ ficha, ordem }: { ficha: Ficha; ordem: number }) {
  const parto = partoDaOrdem(ficha, ordem)

  if (!parto) {
    return <p className="ficha__vazio">O {ordem}º parto ainda não começou.</p>
  }

  return (
    <div className="ficha__aba">
      <h3>Estoque desta caixa — {ordem}º parto</h3>
      <LadoALado>
        <Campo rotulo="Disponíveis para reserva">
          {parto.disponivel.m} M / {parto.disponivel.f} F
        </Campo>
        <Campo rotulo="Já alocados em solicitações">
          {parto.comprometido.m} M / {parto.comprometido.f} F
        </Campo>
      </LadoALado>
      <Campo rotulo="Já entregues">
        {parto.entregue.m} M / {parto.entregue.f} F
      </Campo>
    </div>
  )
}

function AbaEventos({ ficha }: { ficha: Ficha }) {
  if (ficha.eventos.length === 0) {
    return <p className="ficha__vazio">Nenhum evento registrado.</p>
  }

  return (
    <ul className="ficha__eventos">
      {ficha.eventos.map((evento) => (
        <li key={`${evento.dataHora}-${evento.tipo}`} className="ficha__evento">
          <span className="ficha__eventoData">{formatarData(evento.dataHora.slice(0, 10))}</span>
          <span className="ficha__eventoTexto">{evento.descricao}</span>
          <span className="ficha__eventoAutor">{evento.autor}</span>
        </li>
      ))}
    </ul>
  )
}
