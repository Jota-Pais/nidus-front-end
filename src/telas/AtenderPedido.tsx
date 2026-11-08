import { App, Checkbox, InputNumber, Modal } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, Etiqueta, Texto } from '@/componentes'
import { SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useAlocar, useAtendimento } from '@/dominio/consultas'
import { conferirReserva, descreverIdade } from '@/dominio/solicitacao'
import type { ConferenciaDaReserva } from '@/dominio/solicitacao'
import type {
  CaixaCandidata,
  DataISO,
  PorSexo,
  ResultadoDaBusca,
  Solicitacao,
} from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { formatarData, hoje } from '@/lib/data'
import './AtenderPedido.css'

/** Quanto se reserva de cada ninhada, pelo id do parto */
type Reserva = Record<number, PorSexo>

/** Quantos animais: só inteiros, sem setas, teclado numérico no celular */
const QUANTOS = { controls: false, precision: 0, min: 0, inputMode: 'numeric' } as const

/** A sugestão do sistema é a reserva inicial; a equipe desmarca, marca outra e ajusta */
function reservaSugerida(candidatas: CaixaCandidata[]): Reserva {
  return Object.fromEntries(
    candidatas.filter((c) => c.sugerida).map((c) => [c.idParto, { ...c.alocar }]),
  )
}

function somar(reserva: Reserva): PorSexo {
  return Object.values(reserva).reduce((soma, r) => ({ m: soma.m + r.m, f: soma.f + r.f }), {
    m: 0,
    f: 0,
  })
}

/**
 * Reservar os animais de um pedido aprovado: as ninhadas com animais na idade pedida para a data,
 * com a sugestão do sistema já marcada e as caixas onde estão os livres. A equipe pode trocar de
 * ninhada e mudar quanto reserva de cada uma; o pedido só é reservado inteiro. Sem animais para
 * isso, espera ou recusa com o motivo
 */
export function AtenderPedido({
  solicitacao,
  aoFechar,
  aoConcluir,
  aoRecusar,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
  /** os animais reservados: fecha também o pedido aberto embaixo */
  aoConcluir: () => void
  aoRecusar: () => void
}) {
  const { message } = App.useApp()
  const atendimento = useAtendimento(solicitacao)
  const alocar = useAlocar()
  // até a primeira mudança, vale a sugestão que chegou da API
  const [editada, setEditada] = useState<Reserva | null>(null)

  const candidatas = atendimento.data?.candidatas ?? []
  const reserva = editada ?? reservaSugerida(candidatas)
  const reservado = somar(reserva)
  const conferencia = conferirReserva(solicitacao, reservado)

  function marcar(caixa: CaixaCandidata, marcada: boolean) {
    const proxima = { ...reserva }

    if (marcada) {
      // entra com o que ainda falta, até o que a ninhada tem livre: primeiro os sexos pedidos,
      // depois o "qualquer" com a sobra
      const { falta } = conferencia
      const m = Math.min(caixa.disponivel.m, falta.machos)
      const f = Math.min(caixa.disponivel.f, falta.femeas)
      const qualquerM = Math.min(caixa.disponivel.m - m, falta.qualquer)
      const qualquerF = Math.min(caixa.disponivel.f - f, falta.qualquer - qualquerM)
      proxima[caixa.idParto] = { m: m + qualquerM, f: f + qualquerF }
    } else {
      delete proxima[caixa.idParto]
    }

    setEditada(proxima)
  }

  function mudar(caixa: CaixaCandidata, sexo: keyof PorSexo, valor: number | null) {
    const atual = reserva[caixa.idParto] ?? { m: 0, f: 0 }
    setEditada({ ...reserva, [caixa.idParto]: { ...atual, [sexo]: valor ?? 0 } })
  }

  // nenhuma caixa serve: a janela fica só com o que é preciso para a entrega
  const semNenhuma = atendimento.data?.candidatas.length === 0

  function reservar() {
    const itens = Object.entries(reserva)
      .filter(([, r]) => r.m + r.f > 0)
      .map(([idParto, r]) => ({ idParto: Number(idParto), machos: r.m, femeas: r.f }))

    alocar.mutate(
      { idSolicitacao: solicitacao.id, itens },
      {
        onSuccess: () => {
          void message.success(`Animais reservados para o pedido #${solicitacao.id}.`)
          aoConcluir()
        },
        onError: (erro) => void message.error(erro.message),
      },
    )
  }

  return (
    <Modal
      open
      width={760}
      title={`Reservar animais do pedido #${solicitacao.id}`}
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
              disabled={!conferencia.cobre}
              onClick={reservar}
            >
              Reservar
            </Botao>
          </div>
        </div>
      }
    >
      <EstadoDaConsulta consulta={atendimento} rotulo="Procurando as caixas…">
        {atendimento.data &&
          (semNenhuma ? (
            <Aviso tom="atencao" titulo="Não há animais para esta entrega com a idade pedida.">
              Para atender este pedido, {acasalamentosNecessarios(atendimento.data)}.
            </Aviso>
          ) : (
            <>
              <Placar
                solicitacao={solicitacao}
                conferencia={conferencia}
                faixa={atendimento.data.faixa}
              />
              <ul className="atender__lista">
                {candidatas.map((ninhada) => (
                  <Ninhada
                    key={ninhada.idParto}
                    ninhada={ninhada}
                    reserva={reserva[ninhada.idParto]}
                    aoMarcar={(marcada) => marcar(ninhada, marcada)}
                    aoMudar={(sexo, valor) => mudar(ninhada, sexo, valor)}
                  />
                ))}
              </ul>
              <Avisos conferencia={conferencia} busca={atendimento.data} />
            </>
          ))}
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
 * O pedido contra o que está marcado: quantos de cada sexo pedido já estão cobertos, em verde
 * quando completos. Ao lado, a idade e a data da entrega, que decidem as ninhadas que servem
 */
function Placar({
  solicitacao: s,
  conferencia,
  faixa,
}: {
  solicitacao: Solicitacao
  conferencia: ConferenciaDaReserva
  faixa: ResultadoDaBusca['faixa']
}) {
  const contas = [
    { rotulo: 'Machos', pedido: s.machos, falta: conferencia.falta.machos },
    { rotulo: 'Fêmeas', pedido: s.femeas, falta: conferencia.falta.femeas },
    { rotulo: 'Qualquer sexo', pedido: s.qualquer, falta: conferencia.falta.qualquer },
  ].filter((conta) => conta.pedido > 0)

  return (
    <dl className="atender__placar">
      {contas.map(({ rotulo, pedido, falta }) => (
        <div key={rotulo} className="atender__dado">
          <dt>
            <Texto tom="rotulo">{rotulo}</Texto>
          </dt>
          <dd
            className={falta === 0 ? 'atender__conta atender__conta--completa' : 'atender__conta'}
          >
            <span className="atender__numero">{pedido - falta}</span> de {pedido}
          </dd>
        </div>
      ))}
      <div className="atender__dado">
        <dt>
          <Texto tom="rotulo">Idade na entrega</Texto>
        </dt>
        <dd className="atender__idade">
          {descreverIdade(s)}
          <Texto tom="secundario" className="atender__nota">
            aceita de {faixa.min} a {faixa.max}
          </Texto>
        </dd>
      </div>
      <div className="atender__dado">
        <dt>
          <Texto tom="rotulo">Entrega</Texto>
        </dt>
        <dd>{formatarData(s.dataEntrega)}</dd>
      </div>
    </dl>
  )
}

/**
 * Uma ninhada que serve ao pedido: de que casal e parto, a idade na entrega e em que caixas estão
 * os animais livres dela. Marcada, quantos reservar de cada sexo
 */
function Ninhada({
  ninhada: n,
  reserva,
  aoMarcar,
  aoMudar,
}: {
  ninhada: CaixaCandidata
  reserva: PorSexo | undefined
  aoMarcar: (marcada: boolean) => void
  aoMudar: (sexo: keyof PorSexo, valor: number | null) => void
}) {
  const nome = `${n.parto}º parto do casal ${n.casal}`
  const sexos = SEXOS.filter(({ chave }) => n.disponivel[chave] > 0)

  return (
    <li className={reserva ? 'atender__ninhada atender__ninhada--marcada' : 'atender__ninhada'}>
      <div className="atender__sobre">
        <div className="atender__titulo">
          <Checkbox
            checked={reserva !== undefined}
            onChange={(evento) => aoMarcar(evento.target.checked)}
          >
            <strong>
              Casal {n.casal} · {n.parto}º parto
            </strong>
          </Checkbox>
          <Etiqueta>{n.idadeNaEntrega} dias na entrega</Etiqueta>
          {n.origem === 'previsao' && <Etiqueta tom="atencao">Desmama até a entrega</Etiqueta>}
        </div>
        <ul className="atender__lugares" aria-label={`Onde estão os livres do ${nome}`}>
          {n.onde.map((lugar) => (
            <li key={`${lugar.numeroVisivel}-${lugar.codigo}`} className="atender__lugar">
              <span className="atender__codigo">{lugar.codigo}</span>
              {lugar.tipo === 'casal' && <Texto tom="secundario">do casal</Texto>}
              {lugar.m > 0 && <span>{`${SIMBOLO_DO_SEXO.M} ${lugar.m}`}</span>}
              {lugar.f > 0 && <span>{`${SIMBOLO_DO_SEXO.F} ${lugar.f}`}</span>}
              <Texto tom="secundario">{lugar.numeroVisivel}</Texto>
            </li>
          ))}
        </ul>
      </div>

      <div className="atender__quantos">
        {sexos.map(({ chave, simbolo, nome: sexo }) =>
          reserva ? (
            <label key={chave}>
              <span className="atender__simbolo">{simbolo}</span>
              <InputNumber
                {...QUANTOS}
                max={n.disponivel[chave]}
                value={reserva[chave]}
                aria-label={`${sexo} a reservar do ${nome}`}
                onChange={(valor) => aoMudar(chave, valor)}
              />
              <Texto tom="secundario">de {n.disponivel[chave]}</Texto>
            </label>
          ) : (
            <span key={chave} className="atender__livres">
              <span className="atender__simbolo">{simbolo}</span> {n.disponivel[chave]} livres
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
 * O que o placar não diz: o que passou do pedido nas ninhadas marcadas, e o que o plantel inteiro
 * não tem, com os acasalamentos que faltam para isso
 */
function Avisos({
  conferencia,
  busca,
}: {
  conferencia: ConferenciaDaReserva
  busca: ResultadoDaBusca
}) {
  const { aMais } = conferencia
  const sobra =
    aMais.machos + aMais.femeas > 0
      ? porExtenso({ machos: aMais.machos, femeas: aMais.femeas, qualquer: 0 })
      : aMais.total > 0
        ? `${aMais.total} ${aMais.total === 1 ? 'animal' : 'animais'}`
        : null
  // o plantel todo não cobre: não adianta trocar de ninhada
  const semAnimais = busca.deficit.m + busca.deficit.f + busca.deficit.qualquer > 0

  return (
    <>
      {sobra && <Aviso tom="atencao" titulo={`Há ${sobra} a mais nas ninhadas marcadas.`} />}
      {semAnimais && (
        <Aviso tom="atencao" titulo="As caixas não têm animais para o pedido inteiro.">
          Para o que falta, {acasalamentosNecessarios(busca)}.
        </Aviso>
      )}
    </>
  )
}
