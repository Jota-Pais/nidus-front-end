// As ações sobre os animais de uma caixa, de casal ou de estoque: a baixa (morte ou eutanásia, uma
// ação só, com o Desfazer na mensagem) e a mudança para outra caixa (a passagem para o estoque é
// uma delas). Cada ação pede o mínimo: quantos, de qual idade quando a
// caixa tem mais de uma, a data do fato e um clique na estante. Dentro da caixa, só a idade separa
// os animais, e quem escolhe quais saem é a API: os livres primeiro. De qual pedido saem os
// reservados só aparece quando a API pede
import { App, Form, InputNumber, Radio, Select } from 'antd'
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
import type { LugarNaEstante } from '@/dominio/caixa'
import { useAnularBaixa, useBaixa, useMudanca } from '@/dominio/consultas'
import type { GrupoQueMuda, ItemDaBaixa, TipoDaBaixa } from '@/dominio/consultas'
import { descreverQuantos } from '@/dominio/pedido'
import type { DataISO, PorSexo, ReservaDoPedido, Sexo } from '@/dominio/tipos'
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
  /** a linhagem dos vivos dela: a caixa de estoque que os recebe tem de ser a mesma */
  idLinhagem: number | null
}

/** Os vivos da caixa que nasceram no mesmo dia: dentro da caixa, só a idade os separa */
export interface GrupoDaCaixa {
  dtNascimento: DataISO
  vivos: PorSexo
  /** o que cada pedido tem reservado neste grupo, como a API conta */
  reservas: ReservaDoPedido[]
  /**
   * a chegada mais recente dos vivos do grupo na caixa: a baixa e a mudança não ficam antes dela.
   * Na caixa do casal a ninhada nasceu ali, e basta o nascimento (null)
   */
  dtChegada: DataISO | null
}

const OS_DO_SEXO: Record<Sexo, string> = { M: 'os machos', F: 'as fêmeas' }

const OS_RESERVADOS_DO_SEXO: Record<Sexo, string> = {
  M: 'os machos reservados',
  F: 'as fêmeas reservadas',
}

const QUANTOS_DO_SEXO: Record<Sexo, string> = { M: 'Quantos machos', F: 'Quantas fêmeas' }

/** Os pedidos com reservados do sexo no grupo: as opções de "de qual pedido" */
const pedidosDoSexo = (reservas: ReservaDoPedido[], sexo: Sexo) =>
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
  /** sem padrão: quem registra escolhe a causa */
  tipo?: TipoDaBaixa
  dtNascimento?: DataISO
  machos?: QuantosDoSexo
  femeas?: QuantosDoSexo
}

const CAMPOS_DA_BAIXA = [
  'machos.qtd',
  'femeas.qtd',
  'dtFato',
  'tipo',
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
 * As causas da baixa como o formulário as mostra. Antes do desmame elas são os índices do
 * aleitamento: a eutanásia é o ajuste de ninhada (a seleção) e a morte é a morte no aleitamento
 */
const CAUSAS_DA_BAIXA: Record<'aleitamento' | 'depois', { value: TipoDaBaixa; label: string }[]> = {
  aleitamento: [
    { value: 'morte', label: 'Morte no aleitamento' },
    { value: 'eutanasia', label: 'Eutanásia (ajuste de ninhada)' },
  ],
  depois: [
    { value: 'morte', label: 'Morte' },
    { value: 'eutanasia', label: 'Eutanásia' },
  ],
}

/**
 * Morte ou eutanásia, uma ação só, em qualquer caixa: quantos de cada sexo, de qual idade, a data
 * e a causa, que quem registra escolhe (sem padrão). Saem primeiro os livres; a resposta diz que
 * pedidos ficaram em falta. Com 'idParto', a baixa é de um parto ainda em aleitamento (a eutanásia
 * dele é a seleção), e as causas aparecem com o nome do aleitamento. A mensagem de sucesso traz o
 * Desfazer
 */
export function BaixaNaCaixa({
  caixa,
  grupos,
  aoTerminar,
  idParto,
}: {
  caixa: CaixaDaAcao
  grupos: GrupoDaCaixa[]
  aoTerminar: () => void
  idParto?: number
}) {
  const { message, modal } = App.useApp()
  const baixa = useBaixa()
  const anular = useAnularBaixa()
  const [form] = Form.useForm<CamposDaBaixa>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_BAIXA)
  const grupo = grupoEscolhido(grupos, Form.useWatch('dtNascimento', form))
  const machos = Form.useWatch(['machos', 'qtd'], form) ?? 0
  const femeas = Form.useWatch(['femeas', 'qtd'], form) ?? 0

  if (!grupo) return null

  const sexos = SEXOS.filter((sexo) => doSexo(grupo.vivos, sexo) > 0)

  /** A mensagem de sucesso com o Desfazer, que fica 8 segundos e anula a baixa recém-criada */
  function desfazivel(idOcorrencia: number, texto: string) {
    const key = `baixa-${idOcorrencia}`

    function desfazer() {
      void message.open({ key, type: 'loading', content: 'Desfazendo a baixa…', duration: 0 })
      anular.mutateAsync({ idOcorrencia, motivo: 'Desfeita logo após o registro.' }).then(
        () => void message.success({ key, content: 'Baixa desfeita.' }),
        (erro: Error) => void message.error({ key, content: erro.message }),
      )
    }

    void message.success({
      key,
      duration: 8,
      content: (
        <span>
          {texto}{' '}
          <Botao variante="fantasma" size="small" onClick={desfazer}>
            Desfazer
          </Botao>
        </span>
      ),
    })
  }

  function registrar(campos: CamposDaBaixa) {
    // a causa é obrigatória no formulário: sem ela o antd nem chega aqui
    const { tipo } = campos
    if (!grupo || tipo === undefined) return
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
    // mutateAsync: a baixa que esvazia a caixa recarrega a ficha, e este formulário pode sair da
    // tela antes de a resposta chegar
    baixa
      .mutateAsync({
        idCaixa: caixa.id,
        dtFato: campos.dtFato,
        tipo,
        ...(idParto !== undefined && tipo === 'eutanasia' ? { idParto } : {}),
        itens,
      })
      .then(
        (resposta) => {
          const quantos = descreverQuantos({ ...resposta.baixas, qualquer: 0 })
          const liberada = resposta.liberada ? ' A caixa ficou vazia e foi liberada.' : ''
          const texto = `Baixa de ${quantos} registrada.${liberada}`

          // a baixa que esvaziou e liberou a caixa pediria caixa para voltar: sem Desfazer
          if (resposta.liberada) void message.success(texto)
          else desfazivel(resposta.idOcorrencia, texto)

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
          <CampoDeData min={maisTarde(grupo.dtNascimento, grupo.dtChegada)} max={ateHoje()} />
        </Form.Item>
        <Form.Item
          name="tipo"
          label="Causa"
          rules={[{ required: true, message: 'Escolha a causa' }]}
        >
          {/* bolinhas, e não botões: o nome do aleitamento é longo e quebraria dentro do botão */}
          <Radio.Group
            options={CAUSAS_DA_BAIXA[idParto === undefined ? 'depois' : 'aleitamento']}
          />
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
      <Form.Item name="dtFato" label="Data" rules={[{ required: true, message: 'Data' }]}>
        <CampoDeData min={maisTarde(desde, grupo.dtNascimento, grupo.dtChegada)} max={ateHoje()} />
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
