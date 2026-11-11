// A aba Ninhada da ficha do casal: o ciclo de um parto, do acasalamento ao lugar onde os filhotes
// estão. Cada passo mostra o que a API contou nos animais e o formulário do passo seguinte, e cada
// registro tem a correção dele, com motivo. A data do acasalamento é a exceção: ninguém vê o casal
// acasalar, e ela se edita ali mesmo, sem motivo. Nenhum número é contado aqui: nascidos, baixas,
// desmamados, vivos, onde estão e reservados vêm prontos da API
import { App, Form, Input, InputNumber } from 'antd'
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import {
  aMaisNaCorrecao,
  descreverFalta,
  doSexo,
  partosDaCaixa,
  SEXOS,
  vivosNaCaixa,
} from '@/dominio/caixa'
import type { LugarNaEstante } from '@/dominio/caixa'
import {
  useCorrigirAcasalamento,
  useCorrigirEvento,
  useRegistrarNaFicha,
  useSemNinhada,
} from '@/dominio/consultas'
import { descreverQuantos, descreverReservados } from '@/dominio/pedido'
import type { Casal, DataISO, FichaDeCasal, OndeEstao, Parto, PorSexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { ErroDeApi } from '@/lib/api'
import { ateHoje, descreverDias, formatarData, hoje, idadeEmDias, maisTarde } from '@/lib/data'
import { BaixaNaCaixa, CampoDoPedido, MudarAnimais } from './AnimaisDaFicha'
import type { CaixaDaAcao, GrupoDaCaixa } from './AnimaisDaFicha'
import { Campo, LadoALado, Total } from './CamposDaFicha'
import { EscolherCaixa } from './EscolherCaixa'

/** "4 machos e 3 fêmeas" */
const quantos = (porSexo: PorSexo) => descreverQuantos({ ...porSexo, qualquer: 0 })

const porSexo = (porSexo: PorSexo) => `${porSexo.m} M · ${porSexo.f} F`

/**
 * O acasalamento seguinte abre automaticamente no nascimento, 6 dias depois do parto: a regra do cliente,
 * que a API aplica (INTERVALO_ACASALAMENTO_DIAS). Ninguém registra; quem souber a data certa edita
 */
const INTERVALO_ACASALAMENTO_DIAS = 6

/**
 * Os pedidos com reservados do parto: as opções quando a API pede de qual pedido saem os animais
 * da seleção, do desmame ou da correção, que tiram do parto todo
 */
const pedidosDoParto = (parto: Parto) => parto.reservados.map((reserva) => reserva.idPedido)

// ------------------------------------------------------------ uma ação de cada vez

/** A ação aberta na aba, e como abrir outra (ou fechar, com null) */
interface Acoes {
  aberta: string | null
  abrir: (nome: string | null) => void
}

/**
 * No celular a aba tem uma ação aberta por vez: cada registro, correção, baixa ou passagem é um
 * botão largo, e abrir um fecha o outro, em vez de todos os formulários abertos em fila. Fora do
 * celular não há contexto, e cada formulário cuida de si como sempre
 */
const AcaoAberta = createContext<Acoes | null>(null)

/** Se a ação de nome dado está aberta, e como abrir ou fechar ela */
function useAcao(nome: string): [boolean, (aberta: boolean) => void] {
  const acoes = useContext(AcaoAberta)
  const [local, setLocal] = useState(false)

  if (acoes === null) return [local, setLocal]
  return [acoes.aberta === nome, (aberta) => acoes.abrir(aberta ? nome : null)]
}

// ------------------------------------------------------------ registrar e corrigir

interface CampoDoEvento {
  nome: string
  rotulo: string
  tipo: 'data' | 'numero'
  /** data: os fatos de que ela depende; não pode ser antes de nenhum (no mesmo dia pode) */
  desde?: (DataISO | null | undefined)[]
  /** data: os fatos que vêm depois dela; não pode passar de nenhum, nem de hoje */
  ate?: (DataISO | null | undefined)[]
  /** número: o máximo; sem ele, 999 */
  maximo?: number
}

/** O campo de cada fato: a data, com os dias fora da ordem apagados no calendário, ou o número */
function CamposDoEvento({ campos }: { campos: CampoDoEvento[] }) {
  return (
    <LadoALado>
      {campos.map((campo) => (
        <Form.Item
          key={campo.nome}
          name={campo.nome}
          label={campo.rotulo}
          rules={[{ required: true, message: 'Obrigatório' }]}
        >
          {campo.tipo === 'data' ? (
            <CampoDeData
              min={maisTarde(...(campo.desde ?? []))}
              max={ateHoje(...(campo.ate ?? []))}
            />
          ) : (
            <InputNumber
              min={0}
              max={campo.maximo ?? 999}
              precision={0}
              style={{ width: '100%' }}
            />
          )}
        </Form.Item>
      ))}
    </LadoALado>
  )
}

/**
 * Formulário de um registro do parto: nascimento ou desmame. Quando o
 * registro tira animais reservados e há mais de um pedido, a API pede de qual
 * deles, e o campo aparece com os pedidos do parto. Com 'repetir', depois de registrar o
 * formulário volta ao começo, sem o pedido da rodada anterior
 */
function RegistrarEvento({
  nome,
  caminho,
  campos,
  inicial,
  botao,
  pedidos = [],
  repetir = false,
  variante = 'primario',
  children,
}: {
  /** o nome do formulário: os campos de dois formulários abertos não dividem o id */
  nome: string
  caminho: string
  campos: CampoDoEvento[]
  inicial: Record<string, unknown>
  botao: string
  /** os pedidos com reservados que o registro pode tirar */
  pedidos?: number[]
  /** registrar de novo depois: volta o formulário ao começo */
  repetir?: boolean
  /** no celular, o botão que abre o formulário: o passo principal é primário */
  variante?: 'primario' | 'secundario'
  /** o que vem embaixo dos campos, dentro do formulário (o aviso do desmame) */
  children?: ReactNode
}) {
  const { message, modal } = App.useApp()
  const registrar = useRegistrarNaFicha()
  const [form] = Form.useForm<Record<string, unknown>>()
  const falha = useFalhaDoFormulario(form, [...campos.map((campo) => campo.nome), 'idPedido'])
  // no celular o formulário fica atrás do botão dele, e um de cada vez
  const recolhe = useContext(AcaoAberta) !== null
  const [aberto, setAberto] = useAcao(nome)

  if (recolhe && !aberto) {
    return (
      <div>
        <Botao variante={variante} onClick={() => setAberto(true)}>
          {botao}
        </Botao>
      </div>
    )
  }

  function enviar(valores: Record<string, unknown>) {
    falha.limpar()
    // mutateAsync: o registro recarrega a ficha, e o passo seguinte toma o lugar deste formulário
    // antes de a resposta chegar
    registrar.mutateAsync({ caminho, corpo: valores }).then(
      ({ faltas }) => {
        void message.success('Registrado.')
        const falta = descreverFalta(faltas ?? [])
        if (falta) modal.warning({ title: 'Reserva em falta', content: falta })
        if (recolhe) {
          // no celular, registrado, o formulário volta para trás do botão
          setAberto(false)
        } else if (repetir) {
          form.resetFields()
          falha.recomecar()
        }
      },
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name={nome}
      form={form}
      layout="vertical"
      initialValues={inicial}
      className="ficha__formulario"
      onFinish={enviar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CamposDoEvento campos={campos} />
      {falha.pediu('idPedido') && (
        <CampoDoPedido nome={['idPedido']} quem="os animais reservados" pedidos={pedidos} />
      )}
      {children}
      {recolhe ? (
        <div className="ficha__botoes">
          <Botao variante="primario" htmlType="submit" loading={registrar.isPending}>
            {botao}
          </Botao>
          <Botao variante="fantasma" onClick={() => setAberto(false)}>
            Cancelar
          </Botao>
        </div>
      ) : (
        <Botao variante="primario" htmlType="submit" loading={registrar.isPending}>
          {botao}
        </Botao>
      )}
    </Form>
  )
}

function CampoDoMotivo() {
  return (
    <Form.Item
      name="motivo"
      label="Motivo da correção"
      rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
    >
      <Input placeholder="ex: data digitada errada" maxLength={200} />
    </Form.Item>
  )
}

function BotoesDaCorrecao({
  salvando,
  desabilitado = false,
  aoCancelar,
}: {
  salvando: boolean
  /** a correção como está a API recusa: o aviso diz por quê */
  desabilitado?: boolean
  aoCancelar: () => void
}) {
  return (
    <div className="ficha__botoes">
      <Botao variante="primario" htmlType="submit" loading={salvando} disabled={desabilitado}>
        Salvar correção
      </Botao>
      <Botao variante="fantasma" onClick={aoCancelar}>
        Cancelar
      </Botao>
    </div>
  )
}

function BotaoCorrigir({ aoAbrir }: { aoAbrir: () => void }) {
  // no celular, com cara de botão: o de texto parece link e fica solto na tela
  const estreita = useTelaEstreita()

  return (
    <div>
      <Botao variante={estreita ? 'secundario' : 'fantasma'} onClick={aoAbrir}>
        Corrigir
      </Botao>
    </div>
  )
}

/**
 * A data do acasalamento, editável ali mesmo: a que o sistema abriu, 6 dias depois do parto
 * anterior, ou a que alguém pôs. Escolher outro dia grava na hora, sem motivo e sem confirmar, e a
 * que vale é a última. Se a API recusa (fora da ordem dos fatos), o campo volta à data de antes e
 * diz por quê. O calendário apaga os dias fora da ordem, como os outros campos da ficha
 */
function DataDoAcasalamento({
  parto,
  desde,
  ate,
}: {
  parto: Parto
  desde: (DataISO | null | undefined)[]
  ate: (DataISO | null | undefined)[]
}) {
  const { message } = App.useApp()
  const editar = useCorrigirAcasalamento()
  // a data escolhida enquanto grava; a ficha recarrega com ela e o campo monta de novo (key)
  const [escolhida, setEscolhida] = useState<DataISO | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const id = `acasalamento-${parto.id}`

  function mudar(data: DataISO | undefined) {
    // apagar o campo não grava nada: a data continua a de antes
    if (!data || data === (escolhida ?? parto.dtAcasalamento)) return

    setErro(null)
    setEscolhida(data)
    editar.mutateAsync({ idParto: parto.id, dtAcasalamento: data }).then(
      () => void message.success('Registrado.'),
      (falha: Error) => {
        setEscolhida(null)
        setErro(
          falha instanceof ErroDeApi
            ? (falha.campos.dtAcasalamento ?? falha.message)
            : falha.message,
        )
      },
    )
  }

  return (
    <Form layout="vertical" component={false}>
      <Form.Item
        label="Data do acasalamento"
        htmlFor={id}
        validateStatus={erro ? 'error' : ''}
        help={erro ?? undefined}
      >
        <CampoDeData
          id={id}
          value={escolhida ?? parto.dtAcasalamento}
          onChange={mudar}
          min={maisTarde(...desde)}
          max={ateHoje(...ate)}
          disabled={editar.isPending}
        />
      </Form.Item>
    </Form>
  )
}

/**
 * A correção da data do desmame, com motivo. A contagem do desmame não se corrige aqui: lança-se
 * uma baixa
 */
function CorrigirDesmame({
  idParto,
  atual,
  desde,
  ate,
}: {
  idParto: number
  atual: DataISO
  desde: (DataISO | null | undefined)[]
  ate: (DataISO | null | undefined)[]
}) {
  const { message } = App.useApp()
  const corrigir = useCorrigirEvento()
  const [aberto, setAberto] = useAcao('corrigir-desmame')
  const [form] = Form.useForm<{ data: DataISO; motivo: string }>()
  const falha = useFalhaDoFormulario(form, ['data', 'motivo'])

  if (!aberto) return <BotaoCorrigir aoAbrir={() => setAberto(true)} />

  function salvar({ data, motivo }: { data: DataISO; motivo: string }) {
    falha.limpar()
    corrigir
      .mutateAsync({ idParto, evento: 'desmame', corpo: { dtDesmameReal: data, motivo } })
      .then(
        () => {
          void message.success('Correção registrada.')
          setAberto(false)
        },
        // a API aponta a data pelo nome dela no corpo
        (erro: Error) =>
          falha.mostrarComNomes(erro, (chave) => (chave === 'dtDesmameReal' ? 'data' : chave)),
      )
  }

  return (
    <Form
      name="correcao-desmame"
      form={form}
      layout="vertical"
      initialValues={{ data: atual }}
      className="ficha__formulario"
      onFinish={salvar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CamposDoEvento
        campos={[{ nome: 'data', rotulo: 'Data do desmame', tipo: 'data', desde, ate }]}
      />
      <CampoDoMotivo />
      <BotoesDaCorrecao salvando={corrigir.isPending} aoCancelar={() => setAberto(false)} />
    </Form>
  )
}

interface CamposDaCorrecaoDoNascimento {
  dtPartoReal: DataISO
  nascidoM: number
  nascidoF: number
  motivo: string
  idCaixa?: LugarNaEstante
  idPedido?: number
}

/**
 * A correção do nascimento: a data muda a idade de todos os animais do parto, e a contagem troca o
 * sexo, anula registros ou põe animais a mais onde a ninhada está. Se a caixa do casal já tem outra
 * ninhada, ou se ela foi liberada, os a mais vão para uma caixa de estoque do sexo deles, clicada na
 * estante, um sexo por vez
 */
function CorrigirNascimento(props: {
  ficha: FichaDeCasal
  parto: Parto
  caixa: CaixaDaAcao
  /** o parto seguinte do casal: o acasalamento dele limita a data */
  seguinte: Parto | undefined
}) {
  const [aberto, setAberto] = useAcao('corrigir-nascimento')

  if (!aberto) return <BotaoCorrigir aoAbrir={() => setAberto(true)} />

  return <FormularioDoNascimento {...props} aoFechar={() => setAberto(false)} />
}

function FormularioDoNascimento({
  ficha,
  parto,
  caixa,
  seguinte,
  aoFechar,
}: {
  ficha: FichaDeCasal
  parto: Parto
  caixa: CaixaDaAcao
  seguinte: Parto | undefined
  aoFechar: () => void
}) {
  const { message, modal } = App.useApp()
  const corrigir = useCorrigirEvento()
  const [form] = Form.useForm<CamposDaCorrecaoDoNascimento>()
  const falha = useFalhaDoFormulario(form, [
    'dtPartoReal',
    'nascidoM',
    'nascidoF',
    'motivo',
    'idCaixa',
    'idPedido',
  ])
  const nascidoM = Form.useWatch('nascidoM', form)
  const nascidoF = Form.useWatch('nascidoF', form)

  // a troca de sexo não cria animal: só o que sobra dela precisa de lugar
  const novos = aMaisNaCorrecao(
    { m: parto.nascidoM ?? 0, f: parto.nascidoF ?? 0 },
    { m: nascidoM ?? 0, f: nascidoF ?? 0 },
  )
  const aMais = SEXOS.filter((sexo) => doSexo(novos, sexo) > 0)
  // a caixa do casal recebe os a mais se continua ativa e sem outra ninhada
  const outraNinhada = partosDaCaixa(ficha).some(
    (outro) => outro.id !== parto.id && vivosNaCaixa(outro, ficha.caixa.id) !== undefined,
  )
  // a API também diz quando ela não serve e a ficha não sabia: algo mudou na caixa depois de a
  // ficha carregar
  const caixaNaoServe = !ficha.caixa.ativa || outraNinhada || falha.pediu('idCaixa')
  // a caixa de estoque é de um sexo só: com a mais dos dois, a API recusa, e o envio fica preso
  const umSexoPorVez = caixaNaoServe && aMais.length > 1
  const sexoDaCaixa = aMais[0] ?? 'M'
  const pedeCaixa = caixaNaoServe && aMais.length === 1

  function salvar({ idCaixa, idPedido, ...corpo }: CamposDaCorrecaoDoNascimento) {
    falha.limpar()
    const lugar = pedeCaixa ? (idCaixa?.idCaixa ?? null) : null

    corrigir
      .mutateAsync({
        idParto: parto.id,
        evento: 'nascimento',
        corpo: {
          ...corpo,
          ...(lugar === null ? {} : { idCaixa: lugar }),
          ...(idPedido === undefined ? {} : { idPedido }),
        },
      })
      .then(
        ({ faltas }) => {
          void message.success('Correção registrada.')
          const falta = descreverFalta(faltas ?? [])
          if (falta) modal.warning({ title: 'Reserva em falta', content: falta })
          aoFechar()
        },
        (erro: Error) => falha.mostrar(erro),
      )
  }

  return (
    <Form
      name="correcao-nascimento"
      form={form}
      layout="vertical"
      initialValues={{
        dtPartoReal: parto.dtPartoReal,
        nascidoM: parto.nascidoM,
        nascidoF: parto.nascidoF,
      }}
      className="ficha__formulario"
      onFinish={salvar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CamposDoEvento
        campos={[
          {
            nome: 'dtPartoReal',
            rotulo: 'Data do parto',
            tipo: 'data',
            desde: [parto.dtAcasalamento],
            // nem depois do primeiro fato dos animais: a primeira baixa, mudança ou entrega
            ate: [parto.dtDesmameReal, seguinte?.dtAcasalamento, parto.dtPrimeiroFato],
          },
          { nome: 'nascidoM', rotulo: 'Machos nascidos', tipo: 'numero' },
          { nome: 'nascidoF', rotulo: 'Fêmeas nascidas', tipo: 'numero' },
        ]}
      />
      {umSexoPorVez && (
        <Aviso
          tom="atencao"
          titulo="A ninhada já não está na caixa do casal: os animais a mais vão para uma caixa de estoque, que é de um sexo só. Corrija um sexo de cada vez."
        />
      )}
      {pedeCaixa && !umSexoPorVez && (
        <Form.Item
          name="idCaixa"
          label={`A ninhada já não está na caixa do casal: em qual caixa de estoque entram ${sexoDaCaixa === 'M' ? 'os machos' : 'as fêmeas'} a mais`}
          rules={[{ required: true, message: 'Clique na caixa de estoque' }]}
        >
          <EscolherCaixa
            sala={caixa.endereco.sala}
            numeroVisivel={caixa.endereco.numeroVisivel}
            sexo={sexoDaCaixa}
            idLinhagem={caixa.idLinhagem}
            aceitaVazia={false}
            idOrigem={caixa.id}
          />
        </Form.Item>
      )}
      {falha.pediu('idPedido') && (
        <CampoDoPedido
          nome={['idPedido']}
          quem="os animais reservados"
          pedidos={pedidosDoParto(parto)}
        />
      )}
      <CampoDoMotivo />
      <BotoesDaCorrecao
        salvando={corrigir.isPending}
        desabilitado={umSexoPorVez}
        aoCancelar={aoFechar}
      />
    </Form>
  )
}

// ------------------------------------------------------------ o parto pendente

/**
 * O parto pendente do casal encerrado que não vai nascer: fecha sem ninhada, e a caixa vazia é
 * liberada. A data é depois do acasalamento e do encerramento
 */
function FecharSemNinhada({ parto, casal }: { parto: Parto; casal: Casal }) {
  const { message } = App.useApp()
  const fechar = useSemNinhada()
  const [aberto, setAberto] = useAcao('sem-ninhada')
  const [form] = Form.useForm<{ dtSemNinhada: DataISO; motivo: string }>()
  const falha = useFalhaDoFormulario(form, ['dtSemNinhada', 'motivo'])

  if (!aberto) {
    return (
      <div>
        <Botao onClick={() => setAberto(true)}>Fechar sem ninhada</Botao>
      </div>
    )
  }

  function salvar(corpo: { dtSemNinhada: DataISO; motivo: string }) {
    falha.limpar()
    fechar.mutateAsync({ idParto: parto.id, ...corpo }).then(
      () => void message.success(`O ${parto.ordem}º parto foi fechado sem ninhada.`),
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name="sem-ninhada"
      form={form}
      layout="vertical"
      initialValues={{ dtSemNinhada: hoje() }}
      className="ficha__formulario"
      onFinish={salvar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        <Form.Item name="dtSemNinhada" label="Data" rules={[{ required: true, message: 'Data' }]}>
          <CampoDeData
            min={maisTarde(parto.dtAcasalamento, casal.dtEncerramento)}
            max={ateHoje()}
          />
        </Form.Item>
        <Form.Item
          name="motivo"
          label="Por que não vai nascer"
          rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
        >
          <Input placeholder="ex: a fêmea não emprenhou" maxLength={200} />
        </Form.Item>
      </LadoALado>
      <div className="ficha__botoes">
        <Botao variante="perigo" htmlType="submit" loading={fechar.isPending}>
          Fechar sem ninhada
        </Botao>
        <Botao variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}

/**
 * O parto que ainda não existe. O acasalamento dele não se registra: abre automaticamente quando o parto
 * anterior nasce, 6 dias depois, e daí em diante se corrige na aba Ninhada. Aparece nas abas
 * Reprodução e Ninhada
 */
export function ProximoAcasalamento({
  casal,
  partos,
  ordem,
}: {
  casal: Casal | null
  partos: Parto[]
  ordem: number
}) {
  const seguinte = (partos.at(-1)?.ordem ?? 0) + 1

  if (!casal?.ativo) {
    return <p className="ficha__vazio">O {ordem}º parto não aconteceu: o casal está encerrado.</p>
  }

  if (ordem !== seguinte) {
    return (
      <p className="ficha__vazio">
        O {ordem}º parto vem depois do {seguinte}º.
      </p>
    )
  }

  return (
    <p className="ficha__vazio">
      O acasalamento do {ordem}º parto abre automaticamente, {INTERVALO_ACASALAMENTO_DIAS} dias
      depois do nascimento do {ordem - 1}º.
    </p>
  )
}

// ------------------------------------------------------------ desmame

/**
 * O desmame confere a contagem com os vivos: desmamados a menos que os vivos viram baixa, "não
 * chegou ao desmame", na data do desmame. O aviso diz isso enquanto se digita
 */
function AvisoDoDesmame({ vivos }: { vivos: PorSexo }) {
  const form = Form.useFormInstance()
  const m = Form.useWatch<number | null | undefined>('desmamadoM', form)
  const f = Form.useWatch<number | null | undefined>('desmamadoF', form)
  const menos: PorSexo = {
    m: Math.max(vivos.m - (m ?? vivos.m), 0),
    f: Math.max(vivos.f - (f ?? vivos.f), 0),
  }

  if (menos.m + menos.f > 0) {
    return (
      <Aviso
        tom="atencao"
        titulo={`${quantos(menos)} a menos que os vivos: a diferença vira baixa, "não chegou ao desmame", na data do desmame.`}
      />
    )
  }

  return (
    <p className="ficha__dica">
      Vivos hoje: {quantos(vivos)}. Desmamados a menos que os vivos viram baixa, &quot;não chegou ao
      desmame&quot;, na data do desmame.
    </p>
  )
}

// ------------------------------------------------------------ onde estão

/** Uma caixa onde estão vivos do parto: "F1A (E-01), nesta caixa: 4 machos e 4 fêmeas, 2 reservados" */
function descreverLugar(lugar: OndeEstao, idCaixa: number): string {
  const qual =
    lugar.idCaixa === idCaixa
      ? 'nesta caixa'
      : lugar.tipo === 'casal'
        ? 'caixa do casal'
        : 'estoque'
  const reservados =
    lugar.reservados === 0
      ? ''
      : `, ${lugar.reservados} ${lugar.reservados === 1 ? 'reservado' : 'reservados'}`
  return `${lugar.codigo} (${lugar.numeroVisivel}), ${qual}: ${quantos(lugar)}${reservados}`
}

/**
 * Onde estão os vivos do parto, de fato, e quantos estão reservados para cada pedido. Os que ainda
 * estão nesta caixa podem sair por baixa e, depois do desmame, passar para o estoque. A ação
 * oferece só os pedidos com reservados nesta caixa, como a API conta em cada uma
 */
function OndeEstaoOsVivos({
  parto,
  caixa,
  ativa,
}: {
  parto: Parto
  caixa: CaixaDaAcao
  ativa: boolean
}) {
  const [baixa, abrirBaixa] = useAcao('baixa')
  const [passagem, abrirPassagem] = useAcao('passagem')
  const aqui = ativa ? vivosNaCaixa(parto, caixa.id) : undefined
  const grupos: GrupoDaCaixa[] =
    aqui && parto.dtPartoReal
      ? [
          {
            dtNascimento: parto.dtPartoReal,
            vivos: { m: aqui.m, f: aqui.f },
            reservas: aqui.pedidos,
            // a ninhada nasceu na caixa do casal: basta o nascimento
            dtChegada: null,
          },
        ]
      : []
  const reservas = parto.reservados

  return (
    <>
      <h3>Onde estão</h3>
      <LadoALado>
        <Campo rotulo="Vivos">{porSexo(parto.vivos)}</Campo>
        <Campo rotulo="Entregues">{porSexo(parto.entregues)}</Campo>
      </LadoALado>
      {parto.onde.length > 0 && (
        <ul className="ficha__lista">
          {parto.onde.map((lugar) => (
            <li key={lugar.idCaixa}>{descreverLugar(lugar, caixa.id)}</li>
          ))}
        </ul>
      )}
      {reservas.length > 0 && (
        <ul className="ficha__lista">
          {reservas.map((reserva) => (
            <li key={reserva.idPedido}>
              <strong>Pedido #{reserva.idPedido}</strong> {descreverReservados(reserva)}
            </li>
          ))}
        </ul>
      )}

      {baixa && (
        <BaixaNaCaixa
          caixa={caixa}
          grupos={grupos}
          aoTerminar={() => abrirBaixa(false)}
          // antes do desmame é a seleção do parto, e a eutanásia é o que se espera dela
          {...(parto.dtDesmameReal === null
            ? { idParto: parto.id, tipoInicial: 'eutanasia' as const }
            : {})}
        />
      )}
      {passagem && (
        <MudarAnimais
          caixa={caixa}
          grupos={grupos}
          desde={parto.dtDesmameReal}
          botao="Passar para o estoque"
          aoTerminar={() => abrirPassagem(false)}
        />
      )}
      {!baixa && !passagem && grupos.length > 0 && (
        <div className="ficha__botoes">
          {parto.dtDesmameReal && (
            <Botao variante="primario" onClick={() => abrirPassagem(true)}>
              Passar para o estoque
            </Botao>
          )}
          <Botao variante="perigo" onClick={() => abrirBaixa(true)}>
            Registrar baixa
          </Botao>
        </div>
      )}
    </>
  )
}

// ------------------------------------------------------------ a aba

interface PropsDaNinhada {
  ficha: FichaDeCasal
  /** o casal do parto: o da caixa, ou um que veio antes dele */
  casal: Casal | null
  partos: Parto[]
  ordem: number
}

/** A aba Ninhada. No celular, com a ação aberta: uma de cada vez */
export function AbaNinhada(props: PropsDaNinhada) {
  const estreita = useTelaEstreita()
  const [aberta, setAberta] = useState<string | null>(null)

  return (
    <AcaoAberta.Provider value={estreita ? { aberta, abrir: setAberta } : null}>
      <NinhadaDoParto {...props} />
    </AcaoAberta.Provider>
  )
}

function NinhadaDoParto({ ficha, casal, partos, ordem }: PropsDaNinhada) {
  const parto = partos.find((p) => p.ordem === ordem)

  if (!parto) {
    return (
      <div className="ficha__aba">
        <ProximoAcasalamento casal={casal} partos={partos} ordem={ordem} />
      </div>
    )
  }

  const anterior = partos.find((p) => p.ordem === ordem - 1)
  // o acasalamento do parto seguinte limita a correção da data deste parto
  const seguinte = partos.find((p) => p.ordem === ordem + 1)
  const nasceu = parto.dtPartoReal !== null
  const desmamou = parto.dtDesmameReal !== null
  const caixa: CaixaDaAcao = {
    id: ficha.caixa.id,
    endereco: ficha.caixa.endereco,
    idLinhagem: casal?.idLinhagem ?? ficha.caixa.idLinhagem,
  }
  const pedidos = pedidosDoParto(parto)
  // na caixa liberada não se lança fato novo (parto, baixa, desmame); corrigir o que já foi
  // registrado continua
  const semFatoNovo = !ficha.caixa.ativa

  return (
    <div className="ficha__aba">
      <h3>Acasalamento</h3>
      <LadoALado>
        <DataDoAcasalamento
          // a ficha recarrega com a data gravada: o campo começa de novo com ela
          key={`${parto.id}-${parto.dtAcasalamento}`}
          parto={parto}
          desde={[casal?.dtFormacao, anterior?.dtPartoReal]}
          ate={[parto.dtPartoReal, parto.dtSemNinhada, casal?.dtEncerramento]}
        />
      </LadoALado>

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
            Total nascidos: <strong>{(parto.nascidoM ?? 0) + (parto.nascidoF ?? 0)}</strong>
          </Total>
          <CorrigirNascimento ficha={ficha} parto={parto} caixa={caixa} seguinte={seguinte} />
        </>
      ) : parto.dtSemNinhada ? (
        <p className="ficha__vazio">
          Fechado sem ninhada em {formatarData(parto.dtSemNinhada)}: {parto.motivoSemNinhada}
        </p>
      ) : semFatoNovo ? (
        <p className="ficha__vazio">O parto não foi registrado.</p>
      ) : (
        <>
          {casal && !casal.ativo && (
            <Aviso
              tom="informacao"
              titulo="O casal foi encerrado com este parto pendente: a fêmea pare o que carrega. Registre o parto quando nascer, ou feche sem ninhada."
            />
          )}
          <RegistrarEvento
            nome="nascimento"
            caminho={`/api/partos/${parto.id}/nascimento`}
            campos={[
              {
                nome: 'dtPartoReal',
                rotulo: 'Data do parto',
                tipo: 'data',
                desde: [parto.dtAcasalamento],
              },
              { nome: 'nascidoM', rotulo: 'Machos nascidos', tipo: 'numero' },
              { nome: 'nascidoF', rotulo: 'Fêmeas nascidas', tipo: 'numero' },
            ]}
            inicial={{ dtPartoReal: hoje() }}
            botao="Registrar parto"
          />
          {casal && !casal.ativo && <FecharSemNinhada parto={parto} casal={casal} />}
        </>
      )}

      {nasceu && (
        <>
          <h3>Baixas</h3>
          <LadoALado>
            <Campo rotulo="Baixas">{porSexo(parto.baixasAntesDoDesmame)}</Campo>
            {!desmamou && <Campo rotulo="Vivos">{porSexo(parto.vivos)}</Campo>}
          </LadoALado>

          <h3>Desmame</h3>
          {desmamou ? (
            <>
              <Campo rotulo="Data do desmame">{formatarData(parto.dtDesmameReal)}</Campo>
              <LadoALado>
                <Campo rotulo="Machos desmamados">{parto.desmamadoM ?? '—'}</Campo>
                <Campo rotulo="Fêmeas desmamadas">{parto.desmamadoF ?? '—'}</Campo>
              </LadoALado>
              {/* nem antes da última rodada da seleção, nem depois da primeira saída dos animais */}
              <CorrigirDesmame
                idParto={parto.id}
                atual={parto.dtDesmameReal ?? hoje()}
                desde={[parto.dtPartoReal, parto.dtUltimaSelecao]}
                ate={[parto.dtPrimeiraSaida]}
              />
              <p className="ficha__dica">A contagem do desmame se corrige lançando outra baixa.</p>
            </>
          ) : semFatoNovo ? (
            <p className="ficha__vazio">A ninhada não chegou ao desmame.</p>
          ) : (
            <RegistrarEvento
              // a sugestão são os vivos: uma rodada da seleção ou uma baixa muda os vivos, e o
              // formulário volta com a sugestão nova
              key={`${parto.vivos.m}-${parto.vivos.f}`}
              nome="desmame"
              caminho={`/api/partos/${parto.id}/desmame`}
              campos={[
                {
                  nome: 'dtDesmameReal',
                  rotulo: 'Data do desmame',
                  tipo: 'data',
                  // nem antes da última rodada da seleção
                  desde: [parto.dtPartoReal, parto.dtUltimaSelecao],
                },
                { nome: 'desmamadoM', rotulo: 'Machos desmamados', tipo: 'numero' },
                { nome: 'desmamadoF', rotulo: 'Fêmeas desmamadas', tipo: 'numero' },
              ]}
              // a sugestão são os vivos: a seleção e as mortes já saíram deles
              inicial={{
                dtDesmameReal: hoje(),
                desmamadoM: parto.vivos.m,
                desmamadoF: parto.vivos.f,
              }}
              botao="Registrar desmame"
              pedidos={pedidos}
            >
              <AvisoDoDesmame vivos={parto.vivos} />
            </RegistrarEvento>
          )}

          <OndeEstaoOsVivos parto={parto} caixa={caixa} ativa={ficha.caixa.ativa} />
        </>
      )}
    </div>
  )
}
