import { App, Checkbox, InputNumber, Modal } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, Etiqueta, Texto } from '@/componentes'
import { SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useAlocar, useAtendimento } from '@/dominio/consultas'
import type { ItemDaReserva } from '@/dominio/consultas'
import {
  alvoDaReserva,
  conferirReserva,
  descreverIdade,
  descreverQuantos,
  descreverQueFalta,
  reservaPodeIr,
} from '@/dominio/pedido'
import type { ConferenciaDaReserva } from '@/dominio/pedido'
import type { DataISO, LugarCandidato, Pedido, PorSexo, ResultadoDaBusca } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { ErroDeApi } from '@/lib/api'
import { formatarData, hoje } from '@/lib/data'
import './AtenderPedido.css'

/**
 * Quanto se reserva de cada lugar. O lugar é a caixa e a data de nascimento: dentro da caixa, só a
 * idade distingue os ratos
 */
type Reserva = Record<string, PorSexo>

const chaveDoLugar = (lugar: Pick<LugarCandidato, 'idCaixa' | 'dtNascimento'>) =>
  `${lugar.idCaixa}:${lugar.dtNascimento}`

/** Quantos animais: só inteiros, sem setas, teclado numérico no celular */
const QUANTOS = { controls: false, precision: 0, min: 0, inputMode: 'numeric' } as const

/** A sugestão do sistema é a reserva inicial; a equipe desmarca, marca outro lugar e ajusta */
function reservaSugerida(candidatas: LugarCandidato[]): Reserva {
  return Object.fromEntries(
    candidatas.filter((c) => c.sugerida).map((c) => [chaveDoLugar(c), { ...c.alocar }]),
  )
}

function somar(quantos: PorSexo[]): PorSexo {
  return quantos.reduce((soma, r) => ({ m: soma.m + r.m, f: soma.f + r.f }), { m: 0, f: 0 })
}

/**
 * Reservar os animais do pedido: os lugares (caixa e data de nascimento) com animais livres na
 * idade pedida para a data, com a sugestão do sistema já marcada. A equipe pode trocar de lugar e
 * mudar quanto reserva de cada um. O pedido aprovado só se reserva inteiro; no reservado que perdeu
 * animais, a mesma janela completa a falta, aos poucos se for preciso, sem passar do que falta.
 * Sem animais para isso, espera ou recusa com o motivo
 */
export function AtenderPedido({
  pedido,
  aoFechar,
  aoConcluir,
  aoRecusar,
}: {
  pedido: Pedido
  aoFechar: () => void
  /** os animais reservados: fecha também o pedido aberto embaixo */
  aoConcluir: () => void
  aoRecusar: () => void
}) {
  const { message } = App.useApp()
  const atendimento = useAtendimento(pedido)
  const alocar = useAlocar()
  // até a primeira mudança, vale a sugestão que chegou da API
  const [editada, setEditada] = useState<Reserva | null>(null)
  const [falha, setFalha] = useState<string | null>(null)

  // o reservado em falta completa só o que falta; o aprovado reserva o pedido inteiro
  const completar = pedido.status === 'reservado'
  const alvo = alvoDaReserva(pedido)
  const candidatas = atendimento.data?.candidatas ?? []
  const reserva = editada ?? reservaSugerida(candidatas)
  // só os lugares da busca de agora: o que sumiu depois de recarregar sai da reserva
  const marcadas = candidatas.flatMap((c) => {
    const quantos = reserva[chaveDoLugar(c)]
    return quantos ? [{ lugar: c, quantos }] : []
  })
  const reservado = somar(marcadas.map(({ quantos }) => quantos))
  const conferencia = conferirReserva(alvo, reservado)
  // depois de a busca recarregar (a reserva recusada, outra pessoa mexeu), um lugar marcado pode
  // ter menos livres do que o marcado nele
  const lugares = marcadas.map(({ lugar, quantos }) => ({ quantos, livres: lugar.livres }))
  const passaram = marcadas.filter(
    ({ lugar, quantos }) => quantos.m > lugar.livres.m || quantos.f > lugar.livres.f,
  )

  function marcar(lugar: LugarCandidato, marcado: boolean) {
    const proxima = { ...reserva }

    if (marcado) {
      // entra com o que ainda falta, até o que o lugar tem livre: primeiro os sexos pedidos,
      // depois o "qualquer" com a sobra
      const { falta } = conferencia
      const m = Math.min(lugar.livres.m, falta.machos)
      const f = Math.min(lugar.livres.f, falta.femeas)
      const qualquerM = Math.min(lugar.livres.m - m, falta.qualquer)
      const qualquerF = Math.min(lugar.livres.f - f, falta.qualquer - qualquerM)
      proxima[chaveDoLugar(lugar)] = { m: m + qualquerM, f: f + qualquerF }
    } else {
      delete proxima[chaveDoLugar(lugar)]
    }

    setEditada(proxima)
  }

  function mudar(lugar: LugarCandidato, sexo: keyof PorSexo, valor: number | null) {
    const atual = reserva[chaveDoLugar(lugar)] ?? { m: 0, f: 0 }
    setEditada({ ...reserva, [chaveDoLugar(lugar)]: { ...atual, [sexo]: valor ?? 0 } })
  }

  // nenhum lugar serve: a janela fica só com o que é preciso para a entrega
  const semNenhum = atendimento.data?.candidatas.length === 0

  function reservar() {
    const itens: ItemDaReserva[] = marcadas
      .filter(({ quantos }) => quantos.m + quantos.f > 0)
      .map(({ lugar, quantos }) => ({
        idCaixa: lugar.idCaixa,
        dtNascimento: lugar.dtNascimento,
        machos: quantos.m,
        femeas: quantos.f,
      }))

    setFalha(null)
    alocar.mutate(
      { idPedido: pedido.id, itens },
      {
        onSuccess: ({ falta }) => {
          void message.success(
            !completar
              ? `Animais reservados para o pedido #${pedido.id}.`
              : falta
                ? `Reserva do pedido #${pedido.id} completada em parte: ainda ${descreverQueFalta(falta)}.`
                : `Reserva do pedido #${pedido.id} completa.`,
          )
          aoConcluir()
        },
        onError: (erro) => {
          // outra pessoa reservou antes (ou o segundo clique): não há o que fazer aqui
          if (erro instanceof ErroDeApi && erro.codigo === 'PEDIDO_JA_RESERVADO') {
            void message.info(erro.message)
            aoConcluir()
            return
          }
          // a busca recarrega (consultas), e a janela mostra os lugares como ficaram
          setFalha(erro.message)
        },
      },
    )
  }

  return (
    <Modal
      open
      width={760}
      title={
        completar
          ? `Completar a reserva do pedido #${pedido.id}`
          : `Reservar animais do pedido #${pedido.id}`
      }
      onCancel={aoFechar}
      footer={
        <div className="atender__rodape">
          <Botao variante="fantasma" onClick={aoRecusar}>
            Recusar
          </Botao>
          <div className="atender__rodapeFim">
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao
              variante="primario"
              loading={alocar.isPending}
              disabled={!reservaPodeIr(conferencia, reservado, !completar, lugares)}
              onClick={reservar}
            >
              {completar ? 'Completar' : 'Reservar'}
            </Botao>
          </div>
        </div>
      }
    >
      <EstadoDaConsulta consulta={atendimento} rotulo="Procurando os animais…">
        {atendimento.data && (
          <div className="atender">
            {completar && pedido.reservaEmFalta && (
              <Texto>
                A reserva deste pedido perdeu animais: {descreverQueFalta(pedido.reservaEmFalta)}.
                Os que continuam reservados ficam; marque de onde completar.
              </Texto>
            )}
            {falha && <Aviso tom="erro" titulo={falha} />}
            {passaram.map(({ lugar }) => (
              <Aviso
                key={chaveDoLugar(lugar)}
                tom="atencao"
                titulo={`Livres agora na ${lugar.codigo}, desta idade: ${descreverQuantos({ ...lugar.livres, qualquer: 0 })}. Ajuste o que reservar dela.`}
              />
            ))}
            {semNenhum ? (
              <Aviso
                tom="atencao"
                titulo={
                  completar
                    ? 'Não há animais livres para completar a reserva com a idade pedida.'
                    : 'Não há animais para esta entrega com a idade pedida.'
                }
              >
                {completar ? 'Para completar' : 'Para atender este pedido'},{' '}
                {acasalamentosNecessarios(atendimento.data)}.
              </Aviso>
            ) : (
              <>
                <Placar pedido={pedido} conferencia={conferencia} faixa={atendimento.data.faixa} />
                <ul className="atender__lista">
                  {candidatas.map((lugar) => (
                    <Lugar
                      key={chaveDoLugar(lugar)}
                      lugar={lugar}
                      reserva={reserva[chaveDoLugar(lugar)]}
                      aoMarcar={(marcado) => marcar(lugar, marcado)}
                      aoMudar={(sexo, valor) => mudar(lugar, sexo, valor)}
                    />
                  ))}
                </ul>
                <Avisos conferencia={conferencia} busca={atendimento.data} completar={completar} />
              </>
            )}
          </div>
        )}
      </EstadoDaConsulta>
    </Modal>
  )
}

/** Os dois sexos da reserva, na ordem da tela */
const SEXOS = [
  { chave: 'm', simbolo: SIMBOLO_DO_SEXO.M, nome: 'Machos' },
  { chave: 'f', simbolo: SIMBOLO_DO_SEXO.F, nome: 'Fêmeas' },
] as const

/**
 * O que a reserva tem de cobrir contra o que está marcado: quantos de cada sexo já estão cobertos,
 * em verde quando completos. No reservado em falta, conta só a falta. Ao lado, a idade e a data da
 * entrega, que decidem os lugares que servem
 */
function Placar({
  pedido,
  conferencia,
  faixa,
}: {
  pedido: Pedido
  conferencia: ConferenciaDaReserva
  faixa: ResultadoDaBusca['faixa']
}) {
  const alvo = alvoDaReserva(pedido)
  const contas = [
    { rotulo: 'Machos', alvo: alvo.machos, falta: conferencia.falta.machos },
    { rotulo: 'Fêmeas', alvo: alvo.femeas, falta: conferencia.falta.femeas },
    { rotulo: 'Qualquer sexo', alvo: alvo.qualquer, falta: conferencia.falta.qualquer },
  ].filter((conta) => conta.alvo > 0)

  return (
    <dl className="atender__placar">
      {contas.map(({ rotulo, alvo: quantos, falta }) => (
        <div key={rotulo} className="atender__dado">
          <dt>
            <Texto tom="rotulo">{rotulo}</Texto>
          </dt>
          <dd
            className={falta === 0 ? 'atender__conta atender__conta--completa' : 'atender__conta'}
          >
            <span className="atender__numero">{quantos - falta}</span> de {quantos}
          </dd>
        </div>
      ))}
      <div className="atender__dado">
        <dt>
          <Texto tom="rotulo">Idade na entrega</Texto>
        </dt>
        <dd className="atender__idade">
          {descreverIdade(pedido)}
          <Texto tom="secundario" className="atender__nota">
            aceita de {faixa.min} a {faixa.max}
          </Texto>
        </dd>
      </div>
      <div className="atender__dado">
        <dt>
          <Texto tom="rotulo">Entrega</Texto>
        </dt>
        <dd>{formatarData(pedido.dataEntrega)}</dd>
      </div>
    </dl>
  )
}

const TIPO: Record<LugarCandidato['tipo'], string> = {
  estoque: 'caixa de estoque',
  casal: 'caixa do casal',
}

/**
 * Um lugar que serve ao pedido: a caixa, quando os animais nasceram, de que partos vieram e a
 * idade na entrega. Marcado, quantos reservar de cada sexo
 */
function Lugar({
  lugar: l,
  reserva,
  aoMarcar,
  aoMudar,
}: {
  lugar: LugarCandidato
  reserva: PorSexo | undefined
  aoMarcar: (marcado: boolean) => void
  aoMudar: (sexo: keyof PorSexo, valor: number | null) => void
}) {
  const nome = `caixa ${l.codigo}, nascimento em ${formatarData(l.dtNascimento)}`
  // o sexo que perdeu os livres depois de recarregar continua, para tirar o que passou
  const sexos = SEXOS.filter(({ chave }) => l.livres[chave] > 0 || (reserva?.[chave] ?? 0) > 0)
  const partos = l.partos.map((p) => `${p.ordem}º parto do casal ${p.casal}`).join(', ')

  return (
    <li className={reserva ? 'atender__lugar atender__lugar--marcado' : 'atender__lugar'}>
      <div className="atender__sobre">
        <div className="atender__titulo">
          <Checkbox
            checked={reserva !== undefined}
            aria-label={`Reservar da ${nome}`}
            onChange={(evento) => aoMarcar(evento.target.checked)}
          >
            <span className="atender__codigo">{l.codigo}</span>{' '}
            <Texto tom="secundario">
              {TIPO[l.tipo]} · {l.numeroVisivel}
            </Texto>
          </Checkbox>
          <Etiqueta>{l.idadeNaEntrega} dias na entrega</Etiqueta>
          {l.origem === 'previsao' && <Etiqueta tom="atencao">Desmama até a entrega</Etiqueta>}
        </div>
        <Texto tom="secundario" className="atender__origem">
          Nascimento em {formatarData(l.dtNascimento)} · {partos}
        </Texto>
      </div>

      <div className="atender__quantos">
        {sexos.map(({ chave, simbolo, nome: sexo }) =>
          reserva ? (
            <label key={chave}>
              <span className="atender__simbolo">{simbolo}</span>
              <InputNumber
                {...QUANTOS}
                max={l.livres[chave]}
                // o zero fica no placeholder: apagado o número, o campo não vira "0" e o que se
                // digita depois não sai "02"
                value={reserva[chave] || null}
                placeholder="0"
                aria-label={`${sexo} a reservar da ${nome}`}
                onChange={(valor) => aoMudar(chave, valor)}
              />
              <Texto tom="secundario">de {l.livres[chave]}</Texto>
            </label>
          ) : (
            <span key={chave} className="atender__livres">
              <span className="atender__simbolo">{simbolo}</span> {l.livres[chave]}{' '}
              {l.livres[chave] === 1 ? 'livre' : 'livres'}
            </span>
          ),
        )}
      </div>
    </li>
  )
}

type Quantidades = { machos: number; femeas: number; qualquer: number }

/** "2 machos, 1 fêmea e 12 animais de qualquer sexo": as quantidades numa frase, sem as vazias */
function porExtenso({ machos, femeas, qualquer }: Quantidades): string {
  const partes = [
    machos ? `${machos} ${machos === 1 ? 'macho' : 'machos'}` : null,
    femeas ? `${femeas} ${femeas === 1 ? 'fêmea' : 'fêmeas'}` : null,
    qualquer ? `${qualquer} ${qualquer === 1 ? 'animal' : 'animais'} de qualquer sexo` : null,
  ].filter((parte) => parte !== null)

  return partes.length > 1
    ? `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`
    : (partes[0] ?? '')
}

/**
 * Quando formar, dentro da janela que ainda não passou: "em 16/11/2026" no dia único, "entre
 * 10/11/2026 e 16/11/2026", ou "entre hoje e 16/11/2026" com a janela já aberta
 */
function quandoFormar(janela: { de: DataISO; ate: DataISO }, hojeEm: DataISO): string {
  const comecou = janela.de <= hojeEm
  if (comecou && janela.ate === hojeEm) return 'hoje'
  if (janela.de === janela.ate) return `em ${formatarData(janela.ate)}`

  const inicio = comecou ? 'hoje' : formatarData(janela.de)
  return `entre ${inicio} e ${formatarData(janela.ate)}`
}

/**
 * "são necessários cerca de 2 a 4 acasalamentos entre 12/11/2026 e 16/11/2026": de quantos a
 * quantos, conforme o tamanho das ninhadas, e quando acasalar para que os filhotes cheguem à
 * entrega na idade pedida e desmamados. Com a janela já passada, no condicional
 */
function acasalamentosNecessarios(busca: ResultadoDaBusca, hojeEm: DataISO = hoje()): string {
  const { acasalamentos, formarCasais: janela } = busca.acasalamentoNovo
  const numero =
    acasalamentos.min === acasalamentos.max
      ? `${acasalamentos.max}`
      : `${acasalamentos.min} a ${acasalamentos.max}`
  const quantos = `cerca de ${numero} ${acasalamentos.max === 1 ? 'acasalamento' : 'acasalamentos'}`
  const plural = acasalamentos.max > 1

  if (!janela) {
    return 'não há quando acasalar: na idade pedida, os filhotes ainda não estariam desmamados'
  }
  if (janela.ate < hojeEm) {
    const seriam = plural ? 'seriam necessários' : 'seria necessário'
    return `${seriam} ${quantos} até ${formatarData(janela.ate)}, e essa data já passou`
  }
  const sao = plural ? 'são necessários' : 'é necessário'
  return `${sao} ${quantos} ${quandoFormar(janela, hojeEm)}`
}

/**
 * O que o placar não diz: o que passou do alvo nos lugares marcados, e o que o plantel inteiro não
 * tem, com os acasalamentos que faltam para isso
 */
function Avisos({
  conferencia,
  busca,
  completar,
}: {
  conferencia: ConferenciaDaReserva
  busca: ResultadoDaBusca
  completar: boolean
}) {
  const { aMais } = conferencia
  const sobra =
    aMais.machos + aMais.femeas > 0
      ? porExtenso({ machos: aMais.machos, femeas: aMais.femeas, qualquer: 0 })
      : aMais.total > 0
        ? `${aMais.total} ${aMais.total === 1 ? 'animal' : 'animais'}`
        : null
  // o plantel todo não cobre: não adianta trocar de lugar
  const semAnimais = busca.deficit.m + busca.deficit.f + busca.deficit.qualquer > 0

  return (
    <>
      {sobra && <Aviso tom="atencao" titulo={`Há ${sobra} a mais nos lugares marcados.`} />}
      {semAnimais && (
        <Aviso
          tom="atencao"
          titulo={
            completar
              ? 'As caixas não têm animais para completar a reserva.'
              : 'As caixas não têm animais para o pedido inteiro.'
          }
        >
          Para o que falta, {acasalamentosNecessarios(busca)}.
        </Aviso>
      )}
    </>
  )
}
