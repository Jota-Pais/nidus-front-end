// Uma aba do lápis Editar por parto do casal da ficha: o que já foi registrado no parto, corrigido
// seção por seção (acasalamento, parto, baixas, desmame), cada uma com o seu Salvar e a sua
// chamada à API, nunca várias de uma vez. Corrigir não pede motivo: o histórico guarda o antes, o
// depois e quem fez. Quem recusa o que ficaria fora de ordem ou contra os animais é a API, e a
// recusa aparece no campo que ela aponta. Lançar fato novo continua na aba Ninhada
import { App, Form, Input, InputNumber, Radio } from 'antd'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import {
  aMaisNaCorrecao,
  avisoDaSelecao,
  CAUSAS_DA_BAIXA,
  descreverFalta,
  doSexo,
  partosDaCaixa,
  pedidosDoParto,
  SEXOS,
  vivosNaCaixa,
} from '@/dominio/caixa'
import type { LugarNaEstante } from '@/dominio/caixa'
import {
  useAnularBaixa,
  useCorrigirAcasalamento,
  useCorrigirBaixa,
  useCorrigirEvento,
} from '@/dominio/consultas'
import type { CorrecaoDoDesmame, TipoDaBaixa } from '@/dominio/consultas'
import { descreverQuantos } from '@/dominio/pedido'
import type {
  BaixaDoParto,
  Casal,
  DataISO,
  FaltaDoPedido,
  FichaDeCasal,
  Parto,
} from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje, formatarData, maisTarde } from '@/lib/data'
import { CampoDoPedido } from './AnimaisDaFicha'
import type { CaixaDaAcao } from './AnimaisDaFicha'
import { LadoALado } from './CamposDaFicha'
import { EscolherCaixa } from './EscolherCaixa'
import { CamposDoEvento } from './NinhadaDaFicha'

/** "4 machos e 3 fêmeas" */
const quantos = (m: number, f: number) => descreverQuantos({ m, f, qualquer: 0 })

/** O aviso dos pedidos que ficaram em falta, depois de salvar: o mesmo dos registros da ficha */
function useAvisoDaFalta() {
  const { modal } = App.useApp()

  return (faltas: FaltaDoPedido[] | undefined) => {
    const falta = descreverFalta(faltas ?? [])
    if (falta) modal.warning({ title: 'Reserva em falta', content: falta })
  }
}

function Salvar({ salvando, desabilitado = false }: { salvando: boolean; desabilitado?: boolean }) {
  return (
    <div className="ficha__botoes">
      <Botao variante="primario" htmlType="submit" loading={salvando} disabled={desabilitado}>
        Salvar
      </Botao>
    </div>
  )
}

interface PropsDoParto {
  ficha: FichaDeCasal
  casal: Casal
  parto: Parto
}

/**
 * A aba de um parto. Cada seção remonta com o que a API gravou (key): depois de salvar, a ficha
 * recarrega e o formulário começa de novo com o valor novo
 */
export function EditarParto({ ficha, casal, parto }: PropsDoParto) {
  const anterior = ficha.partos.find((p) => p.ordem === parto.ordem - 1)
  // o acasalamento do parto seguinte limita a data deste parto
  const seguinte = ficha.partos.find((p) => p.ordem === parto.ordem + 1)
  const caixa: CaixaDaAcao = {
    id: ficha.caixa.id,
    endereco: ficha.caixa.endereco,
    idLinhagem: casal.idLinhagem,
  }

  return (
    <div className="ficha__aba">
      <section aria-label="Acasalamento">
        <h3>Acasalamento</h3>
        <Acasalamento key={parto.dtAcasalamento} casal={casal} parto={parto} anterior={anterior} />
      </section>

      <section aria-label="Parto">
        <h3>Parto</h3>
        {parto.dtPartoReal ? (
          <Nascimento
            key={`${parto.dtPartoReal}-${parto.nascidoM}-${parto.nascidoF}`}
            ficha={ficha}
            parto={parto}
            caixa={caixa}
            seguinte={seguinte}
          />
        ) : parto.dtSemNinhada ? (
          <SemNinhada
            key={`${parto.dtSemNinhada}-${parto.motivoSemNinhada}`}
            casal={casal}
            parto={parto}
          />
        ) : (
          <p className="ficha__vazio">O parto ainda não foi registrado: registre na aba Ninhada.</p>
        )}
      </section>

      {parto.dtPartoReal && (
        <>
          <section aria-label="Baixas">
            <h3>Baixas</h3>
            {parto.baixas.length === 0 ? (
              <p className="ficha__vazio">Nenhuma baixa lançada nos animais deste parto.</p>
            ) : (
              parto.baixas.map((baixa) => (
                <LinhaDaBaixa
                  key={`${baixa.idOcorrencia}-${baixa.dtFato}-${baixa.causa}-${baixa.m}-${baixa.f}`}
                  parto={parto}
                  baixa={baixa}
                  caixa={caixa}
                />
              ))
            )}
          </section>

          <section aria-label="Desmame">
            <h3>Desmame</h3>
            {parto.dtDesmameReal ? (
              <Desmame
                key={`${parto.dtDesmameReal}-${parto.desmamadoM}-${parto.desmamadoF}`}
                parto={parto}
              />
            ) : (
              <p className="ficha__vazio">
                O desmame ainda não foi registrado: registre na aba Ninhada.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------ acasalamento

function Acasalamento({
  casal,
  parto,
  anterior,
}: {
  casal: Casal
  parto: Parto
  anterior: Parto | undefined
}) {
  const { message } = App.useApp()
  const corrigir = useCorrigirAcasalamento()
  const [form] = Form.useForm<{ dtAcasalamento: DataISO }>()
  const falha = useFalhaDoFormulario(form, ['dtAcasalamento'])

  function salvar({ dtAcasalamento }: { dtAcasalamento: DataISO }) {
    falha.limpar()
    corrigir.mutateAsync({ idParto: parto.id, dtAcasalamento }).then(
      () => void message.success('Acasalamento salvo.'),
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name={`acasalamento-${parto.id}`}
      form={form}
      layout="vertical"
      initialValues={{ dtAcasalamento: parto.dtAcasalamento }}
      className="ficha__formulario"
      onFinish={salvar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CamposDoEvento
        campos={[
          {
            nome: 'dtAcasalamento',
            rotulo: 'Data do acasalamento',
            tipo: 'data',
            desde: [casal.dtFormacao, anterior?.dtPartoReal],
            ate: [parto.dtPartoReal, parto.dtSemNinhada, casal.dtEncerramento],
          },
        ]}
      />
      <Salvar salvando={corrigir.isPending} />
    </Form>
  )
}

// ------------------------------------------------------------ parto

interface CamposDoNascimento {
  dtPartoReal: DataISO
  nascidoM: number
  nascidoF: number
  idCaixa?: LugarNaEstante
  idPedido?: number
}

/**
 * A data e a contagem do parto: a data muda a idade de todos os animais do parto, e a contagem
 * troca o sexo, anula registros ou põe animais a mais onde a ninhada está. Se a caixa do casal já
 * tem outra ninhada, ou se ela foi liberada, os a mais vão para uma caixa de estoque do sexo deles,
 * clicada na estante, um sexo por vez
 */
function Nascimento({
  ficha,
  parto,
  caixa,
  seguinte,
}: {
  ficha: FichaDeCasal
  parto: Parto
  caixa: CaixaDaAcao
  seguinte: Parto | undefined
}) {
  const { message } = App.useApp()
  const avisarFalta = useAvisoDaFalta()
  const corrigir = useCorrigirEvento()
  const [form] = Form.useForm<CamposDoNascimento>()
  const falha = useFalhaDoFormulario(form, [
    'dtPartoReal',
    'nascidoM',
    'nascidoF',
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

  function salvar({ idCaixa, idPedido, ...corpo }: CamposDoNascimento) {
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
          void message.success('Parto salvo.')
          avisarFalta(faltas)
        },
        (erro: Error) => falha.mostrar(erro),
      )
  }

  return (
    <Form
      name={`nascimento-${parto.id}`}
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
      <Salvar salvando={corrigir.isPending} desabilitado={umSexoPorVez} />
    </Form>
  )
}

interface CamposDoSemNinhada {
  dtSemNinhada: DataISO
  motivo: string
}

/** O parto fechado sem ninhada: a data e o motivo do fechamento, os dois corrigíveis */
function SemNinhada({ casal, parto }: { casal: Casal; parto: Parto }) {
  const { message } = App.useApp()
  const corrigir = useCorrigirEvento()
  const [form] = Form.useForm<CamposDoSemNinhada>()
  const falha = useFalhaDoFormulario(form, ['dtSemNinhada', 'motivo'])

  function salvar(corpo: CamposDoSemNinhada) {
    falha.limpar()
    corrigir.mutateAsync({ idParto: parto.id, evento: 'sem-ninhada', corpo }).then(
      () => void message.success('Fechamento salvo.'),
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name={`sem-ninhada-${parto.id}`}
      form={form}
      layout="vertical"
      initialValues={{ dtSemNinhada: parto.dtSemNinhada, motivo: parto.motivoSemNinhada }}
      className="ficha__formulario"
      onFinish={salvar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <p className="ficha__dica">Fechado sem ninhada: a data e o motivo do fechamento.</p>
      <LadoALado>
        <Form.Item
          name="dtSemNinhada"
          label="Data do fechamento"
          rules={[{ required: true, message: 'Data' }]}
        >
          <CampoDeData
            min={maisTarde(parto.dtAcasalamento, casal.dtEncerramento)}
            max={ateHoje()}
          />
        </Form.Item>
        <Form.Item
          name="motivo"
          label="Por que não nasceu"
          rules={[{ required: true, whitespace: true, message: 'Diga o motivo' }]}
        >
          <Input maxLength={200} />
        </Form.Item>
      </LadoALado>
      <Salvar salvando={corrigir.isPending} />
    </Form>
  )
}

// ------------------------------------------------------------ baixas

interface CamposDaBaixa {
  dtFato: DataISO
  tipo: TipoDaBaixa
  qtdM: number
  qtdF: number
  idPedido?: number
  /** só quando a API pede: a caixa da baixa não recebe mais a volta dos animais */
  idCaixaMachos?: LugarNaEstante
  idCaixaFemeas?: LugarNaEstante
}

const CAMPOS_DA_BAIXA = [
  'dtFato',
  'tipo',
  'qtdM',
  'qtdF',
  'idPedido',
  'idCaixaMachos',
  'idCaixaFemeas',
]

/** "16/10/2026, na caixa F1A: 1 macho" */
function descreverBaixa(baixa: BaixaDoParto): string {
  return `${formatarData(baixa.dtFato)}, na caixa ${baixa.codigo}: ${quantos(baixa.m, baixa.f)}`
}

/**
 * Uma baixa lançada nos animais do parto: a data, a causa e quantos de cada sexo, corrigidos de uma
 * vez, e o Excluir, que a anula (os animais voltam a viver). A causa tem o nome do aleitamento até o
 * desmame, como no registro. A baixa "não chegou ao desmame" é a diferença do desmame, e a que leva
 * animais de outra ninhada não é só deste parto: as duas ficam só para ler
 */
function LinhaDaBaixa(props: { parto: Parto; baixa: BaixaDoParto; caixa: CaixaDaAcao }) {
  const { baixa } = props

  if (baixa.doDesmame) {
    return (
      <p className="ficha__dica">
        {descreverBaixa(baixa)}, não {baixa.m + baixa.f === 1 ? 'chegou' : 'chegaram'} ao desmame.
        Corrige-se pela contagem, na seção Desmame.
      </p>
    )
  }

  if (baixa.comOutraNinhada) {
    return (
      <p className="ficha__dica">
        {descreverBaixa(baixa)} deste parto, numa baixa com animais de outra ninhada: não se corrige
        pela ficha deste parto.
      </p>
    )
  }

  return <FormularioDaBaixa {...props} />
}

function FormularioDaBaixa({
  parto,
  baixa,
  caixa,
}: {
  parto: Parto
  baixa: BaixaDoParto
  caixa: CaixaDaAcao
}) {
  const { message, modal } = App.useApp()
  const avisarFalta = useAvisoDaFalta()
  const corrigir = useCorrigirBaixa()
  const anular = useAnularBaixa()
  const [form] = Form.useForm<CamposDaBaixa>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_BAIXA)
  const dtFato = Form.useWatch('dtFato', form) ?? baixa.dtFato
  const noAleitamento = parto.dtDesmameReal === null || dtFato <= parto.dtDesmameReal

  function salvar({ dtFato, tipo, qtdM, qtdF, idPedido }: CamposDaBaixa) {
    falha.limpar()
    corrigir
      .mutateAsync({
        idParto: parto.id,
        idOcorrencia: baixa.idOcorrencia,
        dtFato,
        tipo,
        qtdM,
        qtdF,
        ...(idPedido === undefined ? {} : { idPedido }),
      })
      .then(
        ({ faltas }) => {
          void message.success('Baixa salva.')
          avisarFalta(faltas)
        },
        (erro: Error) => falha.mostrar(erro),
      )
  }

  function excluir() {
    falha.limpar()
    // a caixa de cada sexo só vai quando a API pediu, e alguém clicou nela
    const { idCaixaMachos, idCaixaFemeas } = form.getFieldsValue()

    return anular
      .mutateAsync({
        idOcorrencia: baixa.idOcorrencia,
        ...(idCaixaMachos?.idCaixa ? { idCaixaMachos: idCaixaMachos.idCaixa } : {}),
        ...(idCaixaFemeas?.idCaixa ? { idCaixaFemeas: idCaixaFemeas.idCaixa } : {}),
      })
      .then(
        () => void message.success('Baixa excluída.'),
        (erro: Error) => falha.mostrar(erro),
      )
  }

  function confirmarExclusao() {
    modal.confirm({
      title: 'Excluir a baixa?',
      content: `${quantos(baixa.m, baixa.f)} ${baixa.m + baixa.f === 1 ? 'volta' : 'voltam'} a viver, como se a baixa não tivesse acontecido.`,
      okText: 'Excluir',
      cancelText: 'Cancelar',
      onOk: excluir,
    })
  }

  return (
    <Form
      name={`baixa-${baixa.idOcorrencia}`}
      form={form}
      layout="vertical"
      initialValues={{ dtFato: baixa.dtFato, tipo: baixa.causa, qtdM: baixa.m, qtdF: baixa.f }}
      className="ficha__formulario"
      onFinish={salvar}
      aria-label={`Baixa de ${descreverBaixa(baixa)}`}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        <Form.Item name="dtFato" label="Data" rules={[{ required: true, message: 'Data' }]}>
          <CampoDeData min={parto.dtPartoReal ?? undefined} max={ateHoje()} />
        </Form.Item>
        <Form.Item name="qtdM" label="Machos" rules={[{ required: true, message: 'Obrigatório' }]}>
          <InputNumber min={0} max={999} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="qtdF" label="Fêmeas" rules={[{ required: true, message: 'Obrigatório' }]}>
          <InputNumber min={0} max={999} precision={0} style={{ width: '100%' }} />
        </Form.Item>
      </LadoALado>
      <Form.Item name="tipo" label="Causa" rules={[{ required: true, message: 'Escolha a causa' }]}>
        {/* bolinhas, e não botões: o nome do aleitamento é longo e quebraria dentro do botão */}
        <Radio.Group options={CAUSAS_DA_BAIXA[noAleitamento ? 'aleitamento' : 'depois']} />
      </Form.Item>
      {falha.pediu('idPedido') && (
        <CampoDoPedido
          nome={['idPedido']}
          quem="os animais reservados"
          pedidos={pedidosDoParto(parto)}
        />
      )}
      {SEXOS.filter((sexo) => falha.pediu(sexo === 'M' ? 'idCaixaMachos' : 'idCaixaFemeas')).map(
        (sexo) => (
          <Form.Item
            key={sexo}
            name={sexo === 'M' ? 'idCaixaMachos' : 'idCaixaFemeas'}
            label={`Para qual caixa de estoque ${sexo === 'M' ? 'voltam os machos' : 'voltam as fêmeas'}`}
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
        ),
      )}
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={corrigir.isPending}>
          Salvar
        </Botao>
        <Botao variante="perigo" onClick={confirmarExclusao} loading={anular.isPending}>
          Excluir
        </Botao>
      </div>
    </Form>
  )
}

// ------------------------------------------------------------ desmame

interface CamposDoDesmame {
  dtDesmameReal: DataISO
  desmamadoM: number
  desmamadoF: number
  idPedido?: number
}

/**
 * A data e a contagem do desmame. A contagem só vai para a API quando muda: com a data nova, quem
 * morreu entre as duas datas passa a contar de outro jeito, e a API recalcula. Ela muda pela baixa
 * "não chegou ao desmame": subir desfaz animais dela, descer lança nela vivos da caixa do casal
 */
function Desmame({ parto }: { parto: Parto }) {
  const { message } = App.useApp()
  const avisarFalta = useAvisoDaFalta()
  const corrigir = useCorrigirEvento()
  const [form] = Form.useForm<CamposDoDesmame>()
  const falha = useFalhaDoFormulario(form, [
    'dtDesmameReal',
    'desmamadoM',
    'desmamadoF',
    'idPedido',
  ])

  function salvar({ dtDesmameReal, desmamadoM, desmamadoF, idPedido }: CamposDoDesmame) {
    falha.limpar()
    const corpo: CorrecaoDoDesmame = {
      dtDesmameReal,
      ...(desmamadoM === parto.desmamadoM ? {} : { desmamadoM }),
      ...(desmamadoF === parto.desmamadoF ? {} : { desmamadoF }),
      ...(idPedido === undefined ? {} : { idPedido }),
    }

    corrigir.mutateAsync({ idParto: parto.id, evento: 'desmame', corpo }).then(
      ({ faltas }) => {
        void message.success('Desmame salvo.')
        avisarFalta(faltas)
      },
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name={`desmame-${parto.id}`}
      form={form}
      layout="vertical"
      initialValues={{
        dtDesmameReal: parto.dtDesmameReal,
        desmamadoM: parto.desmamadoM,
        desmamadoF: parto.desmamadoF,
      }}
      className="ficha__formulario"
      onFinish={salvar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <CamposDoEvento
        campos={[
          {
            nome: 'dtDesmameReal',
            rotulo: 'Data do desmame',
            tipo: 'data',
            // nem antes do parto, nem depois da primeira saída dos animais; a seleção vai junto
            desde: [parto.dtPartoReal],
            ate: [parto.dtPrimeiraSaida],
            aviso: avisoDaSelecao(parto.dtUltimaSelecao),
          },
          { nome: 'desmamadoM', rotulo: 'Machos desmamados', tipo: 'numero' },
          { nome: 'desmamadoF', rotulo: 'Fêmeas desmamadas', tipo: 'numero' },
        ]}
      />
      <p className="ficha__dica">
        A contagem muda pela baixa &quot;não chegou ao desmame&quot;: subir desfaz animais dela,
        descer lança nela vivos que continuam na caixa do casal.
      </p>
      {falha.pediu('idPedido') && (
        <CampoDoPedido
          nome={['idPedido']}
          quem="os animais reservados"
          pedidos={pedidosDoParto(parto)}
        />
      )}
      <Salvar salvando={corrigir.isPending} />
    </Form>
  )
}
