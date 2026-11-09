// As ações sobre os animais de uma caixa, de casal ou de estoque: a baixa (morte ou eutanásia, uma
// ação só), a mudança para outra caixa (a passagem para o estoque é uma delas) e, nos eventos, a
// anulação da baixa lançada por engano. Cada ação pede o mínimo: quantos, de qual idade quando a
// caixa tem mais de uma, a data do fato e um clique na estante. Dentro da caixa, só a idade separa
// os animais, e quem escolhe quais saem é a API: os livres primeiro. De qual pedido saem os
// reservados só aparece quando a API pede
import { App, Form, Input, InputNumber, Radio, Select } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import {
  CAMPO_DO_SEXO,
  contarDoSexo,
  descreverFalta,
  destinoDoLugar,
  doSexo,
  ROTULO_DO_SEXO,
  SEXOS,
  SIMBOLO_DO_SEXO,
} from '@/dominio/caixa'
import type { LugarNaEstante, ReservaNaCaixa } from '@/dominio/caixa'
import { useAnularBaixa, useBaixa, useMudanca } from '@/dominio/consultas'
import type { GrupoQueMuda, ItemDaBaixa } from '@/dominio/consultas'
import { descreverQuantos } from '@/dominio/pedido'
import type { DataISO, EventoDaFicha, PorSexo, Sexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import type { NomeNoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje, descreverDias, formatarData, idadeEmDias, maisTarde } from '@/lib/data'
import { LadoALado } from './CamposDaFicha'
import { EscolherCaixa } from './EscolherCaixa'
import './AnimaisDaFicha.css'

/** A caixa onde a ação acontece */
export interface CaixaDaAcao {
  id: number
  endereco: { sala: string; numeroVisivel: string; codigo: string }
  /** a linhagem dos animais dela: a caixa de estoque que os recebe tem de ser a mesma */
  idLinhagem: number | null
}

/** Os vivos da caixa que nasceram no mesmo dia: dentro da caixa, só a idade os separa */
export interface GrupoDaCaixa {
  dtNascimento: DataISO
  vivos: PorSexo
  /** o que cada pedido tem reservado neste grupo (reservasNoGrupo) */
  reservas: ReservaNaCaixa[]
}

const OS_DO_SEXO: Record<Sexo, string> = { M: 'os machos', F: 'as fêmeas' }

const OS_RESERVADOS_DO_SEXO: Record<Sexo, string> = {
  M: 'os machos reservados',
  F: 'as fêmeas reservadas',
}

const QUANTOS_DO_SEXO: Record<Sexo, string> = { M: 'Quantos machos', F: 'Quantas fêmeas' }

/** Os pedidos com reservados do sexo no grupo: as opções de "de qual pedido" */
const pedidosDoSexo = (reservas: ReservaNaCaixa[], sexo: Sexo) =>
  reservas.filter((reserva) => doSexo(reserva, sexo) > 0).map((reserva) => reserva.idPedido)

/**
 * De qual pedido saem os reservados quando os livres não bastam. Só aparece quando a API pede:
 * com reservados de mais de um pedido no grupo, quem decide é o técnico
 */
export function CampoDoPedido({
  nome,
  quem,
  pedidos,
}: {
  nome: (string | number)[]
  /** "os machos reservados", "as fêmeas reservadas", "os animais reservados" */
  quem: string
  pedidos: number[]
}) {
  return (
    <Form.Item
      name={nome}
      label={`Os livres não bastam: de qual pedido saem ${quem}`}
      rules={[{ required: true, message: 'Escolha o pedido' }]}
    >
      <Select
        placeholder="Escolha o pedido"
        options={pedidos.map((idPedido) => ({ value: idPedido, label: `Pedido #${idPedido}` }))}
      />
    </Form.Item>
  )
}

/** "nascidos em 24/09/2026, 44 dias: 4 machos" */
function descreverGrupo(grupo: GrupoDaCaixa): string {
  const quantos = descreverQuantos({ ...grupo.vivos, qualquer: 0 })
  return `nascidos em ${formatarData(grupo.dtNascimento)}, ${descreverDias(idadeEmDias(grupo.dtNascimento))}: ${quantos}`
}

/** Com mais de uma idade na caixa, de qual ela é. Com uma só, o campo nem aparece */
function CampoDaIdade({ grupos }: { grupos: GrupoDaCaixa[] }) {
  if (grupos.length < 2) return null

  return (
    <Form.Item name="dtNascimento" label="De qual idade" rules={[{ required: true }]}>
      <Radio.Group
        className="animais__idades"
        options={grupos.map((grupo) => ({
          value: grupo.dtNascimento,
          label: descreverGrupo(grupo),
        }))}
      />
    </Form.Item>
  )
}

/** O grupo escolhido no campo da idade, ou o único que há */
function grupoEscolhido(grupos: GrupoDaCaixa[], dtNascimento: DataISO | undefined) {
  return grupos.find((grupo) => grupo.dtNascimento === dtNascimento) ?? grupos[0]
}

// ------------------------------------------------------------ baixa

interface QuantosDoSexo {
  qtd?: number | null
  idPedido?: number
}

interface CamposDaBaixa {
  dtFato: DataISO
  motivo?: string
  dtNascimento?: DataISO
  machos?: QuantosDoSexo
  femeas?: QuantosDoSexo
}

const CAMPOS_DA_BAIXA = [
  'machos.qtd',
  'femeas.qtd',
  'dtFato',
  'motivo',
  'dtNascimento',
  'machos.idPedido',
  'femeas.idPedido',
]

/**
 * A API fala nos itens que o formulário mandou ('itens.1.idPedido'); o formulário, nos sexos
 * ('femeas.idPedido'). A idade é uma só para os dois
 */
function nomeDoItem(itens: Pick<ItemDaBaixa, 'sexo'>[]): NomeNoFormulario {
  return (chave) => {
    const [, indice, resto] = /^itens\.(\d+)\.(.+)$/.exec(chave) ?? []
    const item = itens[Number(indice)]
    if (item === undefined || resto === undefined) return chave
    return resto === 'dtNascimento' ? 'dtNascimento' : `${CAMPO_DO_SEXO[item.sexo]}.${resto}`
  }
}

/**
 * Morte ou eutanásia, uma ação só, em qualquer caixa: quantos de cada sexo, de qual idade, a data
 * e, se quiser, o motivo. Saem primeiro os livres; a resposta diz que pedidos ficaram em falta
 */
export function BaixaNaCaixa({
  caixa,
  grupos,
  aoTerminar,
}: {
  caixa: CaixaDaAcao
  grupos: GrupoDaCaixa[]
  aoTerminar: () => void
}) {
  const { message, modal } = App.useApp()
  const baixa = useBaixa()
  const [form] = Form.useForm<CamposDaBaixa>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_BAIXA)
  const grupo = grupoEscolhido(grupos, Form.useWatch('dtNascimento', form))
  const machos = Form.useWatch(['machos', 'qtd'], form) ?? 0
  const femeas = Form.useWatch(['femeas', 'qtd'], form) ?? 0

  if (!grupo) return null

  const sexos = SEXOS.filter((sexo) => doSexo(grupo.vivos, sexo) > 0)

  function registrar(campos: CamposDaBaixa) {
    if (!grupo) return
    falha.limpar()

    const itens: ItemDaBaixa[] = sexos.flatMap((sexo) => {
      const doGrupo = campos[CAMPO_DO_SEXO[sexo]]
      const qtd = doGrupo?.qtd ?? 0
      if (qtd === 0) return []

      return [
        {
          sexo,
          qtd,
          dtNascimento: grupo.dtNascimento,
          ...(doGrupo?.idPedido === undefined ? {} : { idPedido: doGrupo.idPedido }),
        },
      ]
    })
    const motivo = campos.motivo?.trim()

    // mutateAsync: a baixa que esvazia a caixa recarrega a ficha, e este formulário pode sair da
    // tela antes de a resposta chegar
    baixa
      .mutateAsync({
        idCaixa: caixa.id,
        dtFato: campos.dtFato,
        itens,
        ...(motivo ? { motivo } : {}),
      })
      .then(
        (resposta) => {
          const quantos = descreverQuantos({ ...resposta.baixas, qualquer: 0 })
          const liberada = resposta.liberada ? ' A caixa ficou vazia e foi liberada.' : ''
          void message.success(`Baixa de ${quantos} registrada.${liberada}`)

          const falta = descreverFalta(resposta.faltas)
          if (falta) modal.warning({ title: 'Reserva em falta', content: falta })
          aoTerminar()
        },
        (erro: Error) => falha.mostrarComNomes(erro, nomeDoItem(itens)),
      )
  }

  return (
    <Form
      name="baixa"
      form={form}
      layout="vertical"
      className="ficha__formulario"
      initialValues={{
        dtFato: ateHoje(),
        dtNascimento: grupo.dtNascimento,
        machos: { qtd: 0 },
        femeas: { qtd: 0 },
      }}
      onFinish={registrar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CampoDaIdade grupos={grupos} />
      <LadoALado>
        {sexos.map((sexo) => (
          <Form.Item
            key={sexo}
            name={[CAMPO_DO_SEXO[sexo], 'qtd']}
            label={ROTULO_DO_SEXO[sexo]}
            extra={`de ${doSexo(grupo.vivos, sexo)}`}
          >
            <InputNumber
              min={0}
              max={doSexo(grupo.vivos, sexo)}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        ))}
      </LadoALado>
      {sexos
        .filter((sexo) => falha.pediu(`${CAMPO_DO_SEXO[sexo]}.idPedido`))
        .map((sexo) => (
          <CampoDoPedido
            key={sexo}
            nome={[CAMPO_DO_SEXO[sexo], 'idPedido']}
            quem={OS_RESERVADOS_DO_SEXO[sexo]}
            pedidos={pedidosDoSexo(grupo.reservas, sexo)}
          />
        ))}
      <LadoALado>
        <Form.Item name="dtFato" label="Data" rules={[{ required: true, message: 'Data' }]}>
          <CampoDeData min={grupo.dtNascimento} max={ateHoje()} />
        </Form.Item>
        <Form.Item name="motivo" label="Motivo (opcional)">
          <Input maxLength={200} placeholder="ex: morte, eutanásia por doença" />
        </Form.Item>
      </LadoALado>
      <div className="ficha__botoes">
        <Botao
          variante="perigo"
          htmlType="submit"
          loading={baixa.isPending}
          disabled={machos + femeas === 0}
        >
          Registrar baixa
        </Botao>
        <Botao variante="fantasma" onClick={aoTerminar}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}

// ------------------------------------------------------------ mudança

/** 'livres': os livres primeiro, como em toda escolha; um pedido: só os reservados dele */
type Quais = 'livres' | number

interface SexoQueMuda {
  qtd?: number | null
  quais?: Quais
  destino?: LugarNaEstante
  idPedido?: number
}

interface CamposDaMudanca {
  dtFato: DataISO
  dtNascimento?: DataISO
  machos?: SexoQueMuda
  femeas?: SexoQueMuda
}

const CAMPOS_DA_MUDANCA = [
  'dtFato',
  'dtNascimento',
  ...SEXOS.flatMap((sexo) =>
    ['qtd', 'quais', 'destino', 'idPedido'].map((campo) => `${CAMPO_DO_SEXO[sexo]}.${campo}`),
  ),
]

/**
 * Para cada sexo, quantos e um clique na caixa onde vão: uma posição vazia vira caixa de estoque
 * nova, e uma caixa de estoque do mesmo sexo e linhagem recebe mais animais. Serve para a passagem
 * da caixa do casal para o estoque e para juntar ou separar caixas de estoque. Saem os livres
 * primeiro; quando a caixa tem reservados, dá para levar só os de um pedido. A reserva vai junto
 */
export function MudarAnimais({
  caixa,
  grupos,
  desde,
  botao,
  aoTerminar,
}: {
  caixa: CaixaDaAcao
  grupos: GrupoDaCaixa[]
  /** o primeiro dia da mudança: o desmame, quando os animais saem da caixa do casal */
  desde?: DataISO | null | undefined
  botao: string
  aoTerminar: () => void
}) {
  const { message } = App.useApp()
  const mudar = useMudanca()
  const [form] = Form.useForm<CamposDaMudanca>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_MUDANCA)
  const grupo = grupoEscolhido(grupos, Form.useWatch('dtNascimento', form))
  const machos = Form.useWatch('machos', form)
  const femeas = Form.useWatch('femeas', form)

  if (!grupo) return null

  const sexos = SEXOS.filter((sexo) => doSexo(grupo.vivos, sexo) > 0)
  const doSexoNoForm: Record<Sexo, SexoQueMuda | undefined> = { M: machos, F: femeas }
  const nenhum = sexos.every((sexo) => (doSexoNoForm[sexo]?.qtd ?? 0) === 0)

  /**
   * Trocar a idade ou o pedido refaz as quantidades: todos do grupo, ou os reservados do pedido no
   * grupo. A idade nova volta aos livres primeiro: os pedidos dela são outros
   */
  function aoMudarValores(mudou: Partial<CamposDaMudanca>) {
    const novo = grupoEscolhido(grupos, form.getFieldValue('dtNascimento') as DataISO | undefined)
    if (!novo) return

    for (const sexo of SEXOS) {
      const campo = CAMPO_DO_SEXO[sexo]
      const quais = mudou[campo]?.quais
      const vivos = doSexo(novo.vivos, sexo)

      if (mudou.dtNascimento !== undefined) {
        form.setFieldValue([campo, 'qtd'], vivos)
        form.setFieldValue([campo, 'quais'], 'livres')
      }
      if (quais === 'livres') form.setFieldValue([campo, 'qtd'], vivos)
      if (typeof quais === 'number') {
        const reserva = novo.reservas.find((r) => r.idPedido === quais)
        form.setFieldValue([campo, 'qtd'], Math.min(vivos, reserva ? doSexo(reserva, sexo) : 0))
      }
    }
  }

  function mudarAgora(campos: CamposDaMudanca) {
    if (!grupo) return
    falha.limpar()

    const soDoPedido = new Set<string>()
    const corpo: { machos?: GrupoQueMuda; femeas?: GrupoQueMuda } = {}

    for (const sexo of sexos) {
      const campo = CAMPO_DO_SEXO[sexo]
      const doSexoNoCampo = campos[campo]
      const qtd = doSexoNoCampo?.qtd ?? 0
      if (qtd === 0 || !doSexoNoCampo?.destino) continue

      const { quais, idPedido } = doSexoNoCampo
      if (typeof quais === 'number') soDoPedido.add(campo)

      corpo[campo] = {
        qtd,
        dtNascimento: grupo.dtNascimento,
        destino: destinoDoLugar(doSexoNoCampo.destino),
        ...(typeof quais === 'number'
          ? { idPedido: quais, soDoPedido: true }
          : idPedido === undefined
            ? {}
            : { idPedido }),
      }
    }

    // a API fala do pedido do grupo; quando ele é o "só os do pedido", o campo é o de quais
    const nome: NomeNoFormulario = (chave) => {
      if (/^(machos|femeas)\.dtNascimento$/.test(chave)) return 'dtNascimento'
      const [, campo] = /^(machos|femeas)\.idPedido$/.exec(chave) ?? []
      return campo !== undefined && soDoPedido.has(campo) ? `${campo}.quais` : chave
    }

    // mutateAsync: quando todos saem, a caixa é liberada e a ficha recarregada pode já não
    // mostrar este formulário
    mudar.mutateAsync({ idCaixa: caixa.id, dtFato: campos.dtFato, ...corpo }).then(
      ({ caixas, liberada }) => {
        const feitas = caixas.map(
          (feita) => `${contarDoSexo(feita.qtd, feita.sexo)} para a ${feita.codigo}`,
        )
        const vazia = liberada
          ? ` A caixa ${caixa.endereco.codigo} ficou vazia e foi liberada.`
          : ''
        void message.success(`${feitas.join(' e ')}.${vazia}`)
        aoTerminar()
      },
      (erro: Error) => falha.mostrarComNomes(erro, nome),
    )
  }

  return (
    <Form
      name="mudanca"
      form={form}
      layout="vertical"
      className="ficha__formulario"
      initialValues={{
        dtFato: ateHoje(),
        dtNascimento: grupo.dtNascimento,
        machos: { qtd: grupo.vivos.m, quais: 'livres' },
        femeas: { qtd: grupo.vivos.f, quais: 'livres' },
      }}
      onValuesChange={aoMudarValores}
      onFinish={mudarAgora}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CampoDaIdade grupos={grupos} />
      {sexos.map((sexo) => {
        const campo = CAMPO_DO_SEXO[sexo]
        const atual = doSexoNoForm[sexo]
        const pedidos = pedidosDoSexo(grupo.reservas, sexo)
        const outro = doSexoNoForm[sexo === 'M' ? 'F' : 'M']

        return (
          <div key={sexo} className="animais__sexo" role="group" aria-label={ROTULO_DO_SEXO[sexo]}>
            <LadoALado>
              <Form.Item
                name={[campo, 'qtd']}
                label={`${SIMBOLO_DO_SEXO[sexo]} ${ROTULO_DO_SEXO[sexo]}`}
                extra={`de ${doSexo(grupo.vivos, sexo)}`}
              >
                <InputNumber
                  aria-label={QUANTOS_DO_SEXO[sexo]}
                  min={0}
                  max={doSexo(grupo.vivos, sexo)}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              {pedidos.length > 0 && (
                <Form.Item name={[campo, 'quais']} label="Quais">
                  <Select
                    aria-label={`Quais ${ROTULO_DO_SEXO[sexo].toLowerCase()}`}
                    options={[
                      { value: 'livres', label: 'Os livres primeiro' },
                      ...pedidos.map((idPedido) => ({
                        value: idPedido,
                        label: `Só os reservados do pedido #${idPedido}`,
                      })),
                    ]}
                  />
                </Form.Item>
              )}
            </LadoALado>
            {(atual?.qtd ?? 0) > 0 && (
              <Form.Item
                name={[campo, 'destino']}
                label={`Para onde vão ${OS_DO_SEXO[sexo]}`}
                rules={[{ required: true, message: 'Clique na caixa de destino' }]}
              >
                <EscolherCaixa
                  sala={caixa.endereco.sala}
                  numeroVisivel={caixa.endereco.numeroVisivel}
                  sexo={sexo}
                  idLinhagem={caixa.idLinhagem}
                  aceitaVazia
                  idOrigem={caixa.id}
                  doOutroSexo={(outro?.qtd ?? 0) > 0 ? (outro?.destino ?? null) : null}
                />
              </Form.Item>
            )}
            {atual?.quais === 'livres' && falha.pediu(`${campo}.idPedido`) && (
              <CampoDoPedido
                nome={[campo, 'idPedido']}
                quem={OS_RESERVADOS_DO_SEXO[sexo]}
                pedidos={pedidos}
              />
            )}
          </div>
        )
      })}
      <Form.Item
        name="dtFato"
        label="Data da mudança"
        rules={[{ required: true, message: 'Data' }]}
      >
        <CampoDeData min={maisTarde(desde, grupo.dtNascimento)} max={ateHoje()} />
      </Form.Item>
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={mudar.isPending} disabled={nenhum}>
          {botao}
        </Botao>
        <Botao variante="fantasma" onClick={aoTerminar}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}

// ------------------------------------------------------------ eventos e anulação

/** A chave do evento: a ocorrência quando há; o que vem do histórico, pela posição e pelo dia */
const chaveDoEvento = (evento: EventoDaFicha, indice: number) =>
  evento.idOcorrencia === null
    ? `h${indice}-${evento.tipo}-${evento.dataHora}`
    : `o${evento.idOcorrencia}`

/** Os eventos da caixa, do mais antigo para o mais novo. A baixa que ainda pode ser anulada tem o Anular */
export function EventosDaFicha({
  eventos,
  caixa,
}: {
  eventos: EventoDaFicha[]
  caixa: CaixaDaAcao
}) {
  const [anulando, setAnulando] = useState<number | null>(null)

  if (eventos.length === 0) {
    return <p className="ficha__vazio">Nenhum evento registrado.</p>
  }

  return (
    <ul className="ficha__eventos">
      {eventos.map((evento, indice) => {
        // a baixa que ainda pode ser anulada; o Anular abre o formulário embaixo dela
        const anulavel = evento.anulavel ? evento.idOcorrencia : null

        return (
          <li key={chaveDoEvento(evento, indice)} className="ficha__evento">
            <div className="ficha__eventoLinha">
              <span className="ficha__eventoData">
                {formatarData(evento.dataHora.slice(0, 10))}
              </span>
              <span className="ficha__eventoTexto">{evento.descricao}</span>
              <span className="ficha__eventoAutor">{evento.autor}</span>
              {anulavel !== null && anulando !== anulavel && (
                <Botao variante="fantasma" size="small" onClick={() => setAnulando(anulavel)}>
                  Anular
                </Botao>
              )}
            </div>
            {anulavel !== null && anulando === anulavel && (
              <AnularBaixa
                idOcorrencia={anulavel}
                caixa={caixa}
                aoTerminar={() => setAnulando(null)}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** O campo da caixa de cada sexo na anulação */
const CAMPO_DA_VOLTA: Record<Sexo, 'idCaixaMachos' | 'idCaixaFemeas'> = {
  M: 'idCaixaMachos',
  F: 'idCaixaFemeas',
}

interface CamposDaAnulacao {
  motivo: string
  idCaixaMachos?: LugarNaEstante
  idCaixaFemeas?: LugarNaEstante
}

/** "2 machos voltaram para a F1A e 1 fêmea para a F2C" */
function descreverVolta(voltaram: { sexo: Sexo; qtd: number; codigo: string }[]): string {
  return voltaram
    .map((volta) => `${contarDoSexo(volta.qtd, volta.sexo)} para a ${volta.codigo}`)
    .join(' e ')
}

/**
 * A baixa lançada por engano: os animais voltam a viver na caixa dela. Quando ela não serve mais
 * para um sexo (foi liberada, tem outra ninhada, virou estoque de outro sexo), a API pede a caixa
 * de estoque desse sexo, e a estante aparece para clicar nela, só com as que aceitam os animais
 */
function AnularBaixa({
  idOcorrencia,
  caixa,
  aoTerminar,
}: {
  idOcorrencia: number
  caixa: CaixaDaAcao
  aoTerminar: () => void
}) {
  const { message } = App.useApp()
  const anular = useAnularBaixa()
  const [form] = Form.useForm<CamposDaAnulacao>()
  const falha = useFalhaDoFormulario(form, ['motivo', ...SEXOS.map((sexo) => CAMPO_DA_VOLTA[sexo])])

  function anularAgora(campos: CamposDaAnulacao) {
    falha.limpar()

    // a caixa de cada sexo só vai quando a API pediu e alguém clicou nela
    const machos = campos.idCaixaMachos?.idCaixa ?? null
    const femeas = campos.idCaixaFemeas?.idCaixa ?? null

    anular
      .mutateAsync({
        idOcorrencia,
        motivo: campos.motivo.trim(),
        ...(machos === null ? {} : { idCaixaMachos: machos }),
        ...(femeas === null ? {} : { idCaixaFemeas: femeas }),
      })
      .then(
        ({ voltaram, soltos }) => {
          const livres = soltos.m + soltos.f
          const semReserva =
            livres === 0
              ? ''
              : ` Voltaram sem a reserva, porque o pedido não comporta mais: ${descreverQuantos({ ...soltos, qualquer: 0 })}.`
          void message.success(`Baixa anulada: ${descreverVolta(voltaram)}.${semReserva}`)
          aoTerminar()
        },
        (erro: Error) => falha.mostrar(erro),
      )
  }

  return (
    <Form
      name={`anulacao-${idOcorrencia}`}
      form={form}
      layout="vertical"
      className="ficha__formulario"
      onFinish={anularAgora}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <Form.Item
        name="motivo"
        label="Por que a baixa foi um engano"
        rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
      >
        <Input maxLength={200} placeholder="ex: animal contado duas vezes" />
      </Form.Item>
      {SEXOS.filter((sexo) => falha.pediu(CAMPO_DA_VOLTA[sexo])).map((sexo) => (
        <Form.Item
          key={sexo}
          name={CAMPO_DA_VOLTA[sexo]}
          label={`Para qual caixa de estoque voltam ${OS_DO_SEXO[sexo]}`}
          rules={[{ required: true, message: 'Clique na caixa de estoque' }]}
        >
          <EscolherCaixa
            sala={caixa.endereco.sala}
            numeroVisivel={caixa.endereco.numeroVisivel}
            sexo={sexo}
            idLinhagem={caixa.idLinhagem}
            aceitaVazia={false}
            idOrigem={caixa.id}
          />
        </Form.Item>
      ))}
      <div className="ficha__botoes">
        <Botao variante="perigo" htmlType="submit" loading={anular.isPending}>
          Anular baixa
        </Botao>
        <Botao variante="fantasma" onClick={aoTerminar}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}
