// As ações sobre os animais de uma caixa, de casal ou de estoque: a baixa (morte ou eutanásia, uma
// ação só, com o Desfazer na mensagem) e a mudança para outra caixa (a passagem para o estoque é
// uma delas). Cada ação pede o mínimo: quantos, de qual idade quando a
// caixa tem mais de uma, a data do fato e um clique na estante (na mudança, um por caixa, quando o
// sexo se divide em várias). Dentro da caixa, só a idade separa
// os animais, e quem escolhe quais saem é a API: os livres primeiro. De qual pedido saem os
// reservados só aparece quando a API pede
import { App, Form, InputNumber, Radio, Select } from 'antd'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import {
  CAMPO_DO_SEXO,
  CAUSAS_DA_BAIXA,
  contarDoSexo,
  descreverFalta,
  destinoDoLugar,
  doSexo,
  PARTES_POR_SEXO,
  ROTULO_DO_SEXO,
  SEXOS,
  SIMBOLO_DO_SEXO,
} from '@/dominio/caixa'
import type { LugarNaEstante } from '@/dominio/caixa'
import { useAnularBaixa, useBaixa, useMudanca } from '@/dominio/consultas'
import type { GrupoQueMuda, ItemDaBaixa, SexoQueMuda, TipoDaBaixa } from '@/dominio/consultas'
import { descreverQuantos } from '@/dominio/pedido'
import type { DataISO, PorSexo, ReservaDoPedido, Sexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import type { NomeNoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje, descreverDias, formatarData, idadeEmDias, maisTarde } from '@/lib/data'
import { LadoALado } from './CamposDaFicha'
import { EscolherCaixa } from './EscolherCaixa'
import type { LugarOcupado } from './EscolherCaixa'
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

/** Uma caixa que recebe parte dos animais do sexo: quantos e onde */
interface ParteNoFormulario {
  qtd?: number | null
  destino?: LugarNaEstante
}

interface SexoNoFormulario {
  quais?: Quais
  idPedido?: number
  /** começa com uma caixa; "+ outra caixa" divide o sexo em mais */
  partes?: ParteNoFormulario[]
}

interface CamposDaMudanca {
  dtFato: DataISO
  dtNascimento?: DataISO
  machos?: SexoNoFormulario
  femeas?: SexoNoFormulario
}

const CAMPOS_DA_MUDANCA = [
  'dtFato',
  'dtNascimento',
  ...SEXOS.flatMap((sexo) => {
    const campo = CAMPO_DO_SEXO[sexo]
    const dasPartes = Array.from({ length: PARTES_POR_SEXO }, (_, indice) => [
      `${campo}.partes.${indice}.qtd`,
      `${campo}.partes.${indice}.destino`,
    ])
    return [`${campo}.quais`, ...dasPartes.flat(), `${campo}.idPedido`]
  }),
]

const DOS_DO_SEXO: Record<Sexo, string> = { M: 'dos machos', F: 'das fêmeas' }

const somaDasPartes = (partes: ParteNoFormulario[] | undefined) =>
  (partes ?? []).reduce((soma, parte) => soma + (parte.qtd ?? 0), 0)

/** Quantos do sexo podem mudar: todos do grupo, ou só os reservados do pedido escolhido em "Quais" */
function limiteDoSexo(grupo: GrupoDaCaixa, sexo: Sexo, quais: Quais | undefined): number {
  const vivos = doSexo(grupo.vivos, sexo)
  if (typeof quais !== 'number') return vivos

  const reserva = grupo.reservas.find((r) => r.idPedido === quais)
  return Math.min(vivos, reserva ? doSexo(reserva, sexo) : 0)
}

/**
 * Os lugares que as partes com animais já pegaram, menos o da própria parte: a estante de cada
 * parte não oferece o que outra caixa da mesma mudança já tem
 */
function lugaresOcupados(
  noFormulario: Record<Sexo, SexoNoFormulario | undefined>,
  sexos: Sexo[],
  propria: { sexo: Sexo; indice: number },
): LugarOcupado[] {
  return sexos.flatMap((sexo) =>
    (noFormulario[sexo]?.partes ?? []).flatMap((parte, indice) =>
      (parte.qtd ?? 0) > 0 && parte.destino && !(sexo === propria.sexo && indice === propria.indice)
        ? [{ lugar: parte.destino, sexo }]
        : [],
    ),
  )
}

/** "a, b e c" */
function emLista(itens: string[]): string {
  const ultimo = itens.at(-1)
  if (itens.length < 2 || ultimo === undefined) return ultimo ?? ''
  return `${itens.slice(0, -1).join(', ')} e ${ultimo}`
}

/**
 * Para cada sexo, quantos e um clique na caixa onde vão: uma posição vazia vira caixa de estoque
 * nova, e uma caixa de estoque do mesmo sexo e linhagem recebe mais animais. Cada sexo pode ser
 * dividido em várias caixas ("+ outra caixa"), com a soma conferida, e nenhuma caixa recebe duas
 * partes. Serve para a passagem da caixa do casal para o estoque e para juntar ou separar caixas
 * de estoque. Saem os livres primeiro; quando a caixa tem reservados, dá para levar só os de um
 * pedido, o que vale para todas as caixas do sexo. A reserva vai junto
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
  const noFormulario: Record<Sexo, SexoNoFormulario | undefined> = { M: machos, F: femeas }
  const nenhum = sexos.every((sexo) => somaDasPartes(noFormulario[sexo]?.partes) === 0)

  const partesDoCampo = (campo: (typeof CAMPO_DO_SEXO)[Sexo]) =>
    (form.getFieldValue([campo, 'partes']) as ParteNoFormulario[] | undefined) ?? []

  /**
   * Trocar a idade ou o pedido refaz o sexo numa caixa só, com todos do grupo ou os reservados do
   * pedido no grupo; o destino da primeira caixa fica. A idade nova volta aos livres primeiro: os
   * pedidos dela são outros
   */
  function aoMudarValores(mudou: Partial<CamposDaMudanca>) {
    const novo = grupoEscolhido(grupos, form.getFieldValue('dtNascimento') as DataISO | undefined)
    if (!novo) return

    for (const sexo of SEXOS) {
      const campo = CAMPO_DO_SEXO[sexo]
      const quais = mudou.dtNascimento !== undefined ? 'livres' : mudou[campo]?.quais
      if (quais === undefined) continue

      const [primeira] = partesDoCampo(campo)
      form.setFieldValue([campo, 'quais'], quais)
      form.setFieldValue(
        [campo, 'partes'],
        [{ qtd: limiteDoSexo(novo, sexo, quais), destino: primeira?.destino }],
      )
    }
  }

  /**
   * Mais uma caixa para o sexo: com o que falta para o total, ou, se as caixas já levam todos, com
   * metade da última
   */
  function dividir(sexo: Sexo, adicionar: (parte: ParteNoFormulario) => void) {
    if (!grupo) return
    const campo = CAMPO_DO_SEXO[sexo]
    const partes = partesDoCampo(campo)
    const limite = limiteDoSexo(grupo, sexo, form.getFieldValue([campo, 'quais']) as Quais)
    const falta = limite - somaDasPartes(partes)

    if (falta > 0) {
      adicionar({ qtd: falta })
      return
    }

    const ultima = partes.length - 1
    const qtd = partes[ultima]?.qtd ?? 0
    const metade = Math.floor(qtd / 2)
    form.setFieldValue([campo, 'partes', ultima, 'qtd'], qtd - metade)
    adicionar({ qtd: metade })
  }

  /** Tira uma caixa do sexo: os animais dela voltam para a primeira */
  function tirar(sexo: Sexo, indice: number, remover: (indice: number) => void) {
    const campo = CAMPO_DO_SEXO[sexo]
    const partes = partesDoCampo(campo)
    form.setFieldValue(
      [campo, 'partes', 0, 'qtd'],
      (partes[0]?.qtd ?? 0) + (partes[indice]?.qtd ?? 0),
    )
    remover(indice)
  }

  function mudarAgora(campos: CamposDaMudanca) {
    if (!grupo) return
    falha.limpar()

    const soDoPedido = new Set<string>()
    /** de cada sexo, a parte do formulário de cada caixa mandada: a API conta só as mandadas */
    const mandadas: Partial<Record<string, number[]>> = {}
    const corpo: { machos?: SexoQueMuda; femeas?: SexoQueMuda } = {}

    for (const sexo of sexos) {
      const campo = CAMPO_DO_SEXO[sexo]
      const { quais, idPedido, partes = [] } = campos[campo] ?? {}
      const doPedido =
        typeof quais === 'number'
          ? { idPedido: quais, soDoPedido: true }
          : idPedido === undefined
            ? {}
            : { idPedido }

      const comAnimais = partes.flatMap((parte, indice) => {
        const qtd = parte.qtd ?? 0
        if (qtd === 0 || !parte.destino) return []

        const grupoQueMuda: GrupoQueMuda = {
          qtd,
          dtNascimento: grupo.dtNascimento,
          destino: destinoDoLugar(parte.destino),
          ...doPedido,
        }
        return [{ indice, grupoQueMuda }]
      })

      if (comAnimais.length === 0) continue
      if (typeof quais === 'number') soDoPedido.add(campo)

      mandadas[campo] = comAnimais.map((parte) => parte.indice)
      const lista = comAnimais.map((parte) => parte.grupoQueMuda)
      const [unica] = lista
      // uma caixa só vai no formato de grupo; dividido, vai a lista
      corpo[campo] = lista.length === 1 && unica !== undefined ? unica : lista
    }

    // a API fala nas caixas mandadas ('machos.1.destino', ou 'machos.destino' com uma só); o
    // formulário, nas partes dele. O pedido é do sexo; quando ele é o "só os do pedido", o campo é
    // o de quais. A idade é uma só para os dois
    const nome: NomeNoFormulario = (chave) => {
      const [, campo, indice, resto] = /^(machos|femeas)\.(?:(\d+)\.)?(.+)$/.exec(chave) ?? []
      if (campo === undefined || resto === undefined) return chave
      if (resto === 'dtNascimento') return 'dtNascimento'
      if (resto === 'idPedido')
        return soDoPedido.has(campo) ? `${campo}.quais` : `${campo}.idPedido`

      const parte = mandadas[campo]?.[Number(indice ?? 0)]
      return parte === undefined ? chave : `${campo}.partes.${parte}.${resto}`
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
        void message.success(`${emLista(feitas)}.${vazia}`)
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
        machos: { quais: 'livres', partes: [{ qtd: grupo.vivos.m }] },
        femeas: { quais: 'livres', partes: [{ qtd: grupo.vivos.f }] },
      }}
      onValuesChange={aoMudarValores}
      onFinish={mudarAgora}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CampoDaIdade grupos={grupos} />
      {sexos.map((sexo) => {
        const campo = CAMPO_DO_SEXO[sexo]
        const atual = noFormulario[sexo]
        const pedidos = pedidosDoSexo(grupo.reservas, sexo)
        const limite = limiteDoSexo(grupo, sexo, atual?.quais)
        const soma = somaDasPartes(atual?.partes)
        const ficam = limite - soma

        return (
          <div key={sexo} className="animais__sexo" role="group" aria-label={ROTULO_DO_SEXO[sexo]}>
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
            <Form.List name={[campo, 'partes']}>
              {(partes, { add, remove }) => {
                const varias = partes.length > 1

                return (
                  <>
                    {partes.map((parte, indice) => {
                      const qtd = atual?.partes?.[indice]?.qtd ?? 0
                      const ordinal = `${indice + 1}ª caixa`

                      return (
                        <div key={parte.key} className="animais__parte">
                          <div className="animais__quantos">
                            <Form.Item
                              name={[parte.name, 'qtd']}
                              label={`${SIMBOLO_DO_SEXO[sexo]} ${ROTULO_DO_SEXO[sexo]}${varias ? ` na ${ordinal}` : ''}`}
                              extra={varias ? undefined : `de ${limite}`}
                              rules={[
                                {
                                  // a primeira caixa que, somada às de antes, passa do total
                                  validator: async () => {
                                    const todas = partesDoCampo(campo)
                                    const antes = somaDasPartes(todas.slice(0, indice))
                                    const total = somaDasPartes(todas)
                                    const propria = todas[indice]?.qtd ?? 0
                                    if (antes > limite || antes + propria <= limite) return
                                    throw new Error(
                                      `As caixas somam ${total}, mas só há ${limite}: sobram ${limite - antes} para esta.`,
                                    )
                                  },
                                },
                              ]}
                            >
                              <InputNumber
                                aria-label={`${QUANTOS_DO_SEXO[sexo]}${indice > 0 ? ` na ${ordinal}` : ''}`}
                                min={0}
                                max={Math.max(limite - (soma - qtd), 0)}
                                precision={0}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                            {indice > 0 && (
                              <Botao
                                variante="fantasma"
                                size="small"
                                className="animais__tirar"
                                aria-label={`Tirar a ${ordinal} ${DOS_DO_SEXO[sexo]}`}
                                onClick={() => tirar(sexo, indice, remove)}
                              >
                                Tirar
                              </Botao>
                            )}
                          </div>
                          {qtd > 0 && (
                            <Form.Item
                              name={[parte.name, 'destino']}
                              label={
                                varias
                                  ? `Para onde ${qtd === 1 ? 'vai' : 'vão'} ${contarDoSexo(qtd, sexo)}`
                                  : `Para onde vão ${OS_DO_SEXO[sexo]}`
                              }
                              rules={[{ required: true, message: 'Clique na caixa de destino' }]}
                            >
                              <EscolherCaixa
                                sala={caixa.endereco.sala}
                                numeroVisivel={caixa.endereco.numeroVisivel}
                                sexo={sexo}
                                idLinhagem={caixa.idLinhagem}
                                aceitaVazia
                                idOrigem={caixa.id}
                                ocupados={lugaresOcupados(noFormulario, sexos, { sexo, indice })}
                              />
                            </Form.Item>
                          )}
                        </div>
                      )
                    })}
                    <div className="animais__dividir">
                      <span className="animais__soma" aria-live="polite">
                        {varias &&
                          `${soma} de ${limite} nas caixas${ficam > 0 ? `; ${ficam} ${ficam === 1 ? 'fica' : 'ficam'} na ${caixa.endereco.codigo}` : ''}`}
                      </span>
                      <Botao
                        variante="fantasma"
                        size="small"
                        aria-label={`+ outra caixa para ${OS_DO_SEXO[sexo]}`}
                        disabled={partes.length >= PARTES_POR_SEXO || partes.length >= limite}
                        onClick={() => dividir(sexo, add)}
                      >
                        + outra caixa
                      </Botao>
                    </div>
                  </>
                )
              }}
            </Form.List>
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
