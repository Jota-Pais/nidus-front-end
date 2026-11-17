// A aba Ninhada da ficha do casal: o ciclo de um parto, do acasalamento ao lugar onde os filhotes
// estão. Cada passo mostra o que a API contou nos animais e o formulário do passo seguinte: a aba
// lê e lança fato novo (parto, baixa, desmame, fechamento sem ninhada). O que já foi registrado se
// corrige no lápis Editar, no título da ficha (EditarCasal), e não aqui; o Desfazer logo depois de
// lançar a baixa fica. Nenhum número é contado aqui: nascidos, baixas, desmamados, vivos, onde
// estão e reservados vêm prontos da API
import { App, Form, Input, InputNumber } from 'antd'
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import { avisoDaSelecao, descreverFalta, pedidosDoParto, vivosNaCaixa } from '@/dominio/caixa'
import { useRegistrarNaFicha, useSemNinhada } from '@/dominio/consultas'
import { descreverQuantos, descreverReservados } from '@/dominio/pedido'
import type { Casal, DataISO, FichaDeCasal, OndeEstao, Parto, PorSexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { ateHoje, descreverDias, formatarData, hoje, idadeEmDias, maisTarde } from '@/lib/data'
import { BaixaNaCaixa, CampoDoPedido, MudarAnimais } from './AnimaisDaFicha'
import type { CaixaDaAcao, GrupoDaCaixa } from './AnimaisDaFicha'
import { Campo, LadoALado, Total } from './CamposDaFicha'

/** "4 machos e 3 fêmeas" */
const quantos = (porSexo: PorSexo) => descreverQuantos({ ...porSexo, qualquer: 0 })

const porSexo = (porSexo: PorSexo) => `${porSexo.m} M · ${porSexo.f} F`

/**
 * O acasalamento seguinte abre automaticamente no nascimento, 6 dias depois do parto: a regra do cliente,
 * que a API aplica (INTERVALO_ACASALAMENTO_DIAS). Ninguém registra; quem souber a data certa edita
 */
const INTERVALO_ACASALAMENTO_DIAS = 6

// ------------------------------------------------------------ uma ação de cada vez

/** A ação aberta na aba, e como abrir outra (ou fechar, com null) */
interface Acoes {
  aberta: string | null
  abrir: (nome: string | null) => void
}

/**
 * No celular a aba tem uma ação aberta por vez: cada registro, baixa ou passagem é um
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

// ------------------------------------------------------------ registrar

export interface CampoDoEvento {
  nome: string
  rotulo: string
  tipo: 'data' | 'numero'
  /** data: os fatos de que ela depende; não pode ser antes de nenhum (no mesmo dia pode) */
  desde?: (DataISO | null | undefined)[]
  /** data: os fatos que vêm depois dela; não pode passar de nenhum, nem de hoje */
  ate?: (DataISO | null | undefined)[]
  /** número: o máximo; sem ele, 999 */
  maximo?: number
  /** data: o aviso que não impede, embaixo do campo, para a data escolhida (null: nenhum) */
  aviso?: (data: DataISO | undefined) => string | null
}

/**
 * O campo de cada fato: a data, com os dias fora da ordem apagados no calendário, ou o número. O
 * registro aqui e a correção no lápis Editar usam os mesmos
 */
export function CamposDoEvento({ campos }: { campos: CampoDoEvento[] }) {
  return (
    <LadoALado>
      {campos.map((campo) => (
        <CampoDoEventoItem key={campo.nome} campo={campo} />
      ))}
    </LadoALado>
  )
}

function CampoDoEventoItem({ campo }: { campo: CampoDoEvento }) {
  const form = Form.useFormInstance()
  const valor = Form.useWatch<DataISO | undefined>(campo.nome, form)
  const aviso = campo.aviso?.(valor) ?? null

  return (
    <Form.Item
      name={campo.nome}
      label={campo.rotulo}
      rules={[{ required: true, message: 'Obrigatório' }]}
      extra={aviso && <span className="ficha__aviso-do-campo">{aviso}</span>}
    >
      {campo.tipo === 'data' ? (
        <CampoDeData min={maisTarde(...(campo.desde ?? []))} max={ateHoje(...(campo.ate ?? []))} />
      ) : (
        <InputNumber min={0} max={campo.maximo ?? 999} precision={0} style={{ width: '100%' }} />
      )}
    </Form.Item>
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
 * Os vivos do parto que ainda estão nesta caixa, como grupo das ações da caixa (a baixa e a
 * passagem para o estoque). Na caixa liberada, ou sem vivos dele aqui, nenhum. As ações oferecem só
 * os pedidos com reservados nesta caixa, como a API conta em cada uma
 */
function gruposDaNinhada(parto: Parto, idCaixa: number, ativa: boolean): GrupoDaCaixa[] {
  const aqui = ativa ? vivosNaCaixa(parto, idCaixa) : undefined
  if (!aqui || !parto.dtPartoReal) return []

  return [
    {
      dtNascimento: parto.dtPartoReal,
      vivos: { m: aqui.m, f: aqui.f },
      reservas: aqui.pedidos,
      // a ninhada nasceu na caixa do casal: basta o nascimento
      dtChegada: null,
    },
  ]
}

/**
 * A baixa dos vivos do parto que estão nesta caixa, logo abaixo da contagem das baixas: o botão
 * abre o formulário ali mesmo. Antes do desmame é a seleção do parto, e a eutanásia é o que se
 * espera dela
 */
function BaixaDaNinhada({
  parto,
  caixa,
  grupos,
}: {
  parto: Parto
  caixa: CaixaDaAcao
  grupos: GrupoDaCaixa[]
}) {
  const [aberta, abrir] = useAcao('baixa')

  if (aberta) {
    return (
      <BaixaNaCaixa
        caixa={caixa}
        grupos={grupos}
        aoTerminar={() => abrir(false)}
        // antes do desmame a baixa é do aleitamento, e a eutanásia é a seleção do parto
        {...(parto.dtDesmameReal === null ? { idParto: parto.id } : {})}
      />
    )
  }

  if (grupos.length === 0) return null

  return (
    <div className="ficha__botoes">
      <Botao variante="perigo" onClick={() => abrir(true)}>
        Registrar baixa
      </Botao>
    </div>
  )
}

/**
 * Onde estão os vivos do parto, de fato, e quantos estão reservados para cada pedido. Os que ainda
 * estão nesta caixa podem, depois do desmame, passar para o estoque (a baixa fica na seção Baixas)
 */
function OndeEstaoOsVivos({
  parto,
  caixa,
  grupos,
}: {
  parto: Parto
  caixa: CaixaDaAcao
  grupos: GrupoDaCaixa[]
}) {
  const [passagem, abrirPassagem] = useAcao('passagem')
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

      {passagem ? (
        <MudarAnimais
          caixa={caixa}
          grupos={grupos}
          desde={parto.dtDesmameReal}
          botao="Passar para o estoque"
          aoTerminar={() => abrirPassagem(false)}
        />
      ) : (
        parto.dtDesmameReal &&
        grupos.length > 0 && (
          <div className="ficha__botoes">
            <Botao variante="primario" onClick={() => abrirPassagem(true)}>
              Passar para o estoque
            </Botao>
          </div>
        )
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

  const nasceu = parto.dtPartoReal !== null
  const desmamou = parto.dtDesmameReal !== null
  const caixa: CaixaDaAcao = {
    id: ficha.caixa.id,
    endereco: ficha.caixa.endereco,
    idLinhagem: casal?.idLinhagem ?? ficha.caixa.idLinhagem,
  }
  const pedidos = pedidosDoParto(parto)
  // os vivos dele nesta caixa: a baixa (na seção Baixas) e a passagem (em Onde estão) agem neles
  const grupos = gruposDaNinhada(parto, ficha.caixa.id, ficha.caixa.ativa)
  // na caixa liberada não se lança fato novo (parto, baixa, desmame); corrigir o que já foi
  // registrado continua, no lápis Editar
  const semFatoNovo = !ficha.caixa.ativa

  return (
    <div className="ficha__aba">
      <h3>Acasalamento</h3>
      {/* só a leitura: a data se corrige no lápis Editar, como os outros fatos do parto */}
      <Campo rotulo="Data do acasalamento">{formatarData(parto.dtAcasalamento)}</Campo>

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
            <Campo rotulo="Ajuste de ninhada">{porSexo(parto.ajusteDeNinhada)}</Campo>
            <Campo rotulo="Mortes no aleitamento">{porSexo(parto.mortesNoAleitamento)}</Campo>
            {!desmamou && <Campo rotulo="Vivos">{porSexo(parto.vivos)}</Campo>}
          </LadoALado>
          <BaixaDaNinhada parto={parto} caixa={caixa} grupos={grupos} />

          <h3>Desmame</h3>
          {desmamou ? (
            <>
              <Campo rotulo="Data do desmame">{formatarData(parto.dtDesmameReal)}</Campo>
              <LadoALado>
                <Campo rotulo="Machos desmamados">{parto.desmamadoM ?? '—'}</Campo>
                <Campo rotulo="Fêmeas desmamadas">{parto.desmamadoF ?? '—'}</Campo>
              </LadoALado>
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
                  // a seleção não limita: a que ficar depois da data vai para ela
                  desde: [parto.dtPartoReal],
                  aviso: avisoDaSelecao(parto.dtUltimaSelecao),
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

          <OndeEstaoOsVivos parto={parto} caixa={caixa} grupos={grupos} />
        </>
      )}
    </div>
  )
}
