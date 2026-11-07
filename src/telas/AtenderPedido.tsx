import { App, Checkbox, InputNumber, Modal } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, Texto } from '@/componentes'
import { useAlocar, useAtendimento } from '@/dominio/consultas'
import { conferirReserva, descreverAnimais, descreverIdade } from '@/dominio/solicitacao'
import type { ConferenciaDaReserva } from '@/dominio/solicitacao'
import type { CaixaCandidata, PorSexo, ResultadoDaBusca, Solicitacao } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { formatarData } from '@/lib/data'
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
 * Reservar os animais de um pedido aprovado: as caixas com animais na idade pedida para a data,
 * com a sugestão do sistema já marcada. A equipe pode trocar de caixa e mudar quanto reserva de
 * cada uma; o pedido só é reservado inteiro. Sem animais para isso, espera ou recusa com o motivo
 */
export function AtenderPedido({
  solicitacao,
  aoFechar,
  aoRecusar,
}: {
  solicitacao: Solicitacao
  aoFechar: () => void
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

  function reservar() {
    const itens = Object.entries(reserva)
      .filter(([, r]) => r.m + r.f > 0)
      .map(([idParto, r]) => ({ idParto: Number(idParto), machos: r.m, femeas: r.f }))

    alocar.mutate(
      { idSolicitacao: solicitacao.id, itens },
      {
        onSuccess: () => {
          void message.success(`Animais reservados para o pedido #${solicitacao.id}.`)
          aoFechar()
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
      <div className="atender__pedido">
        <span>
          {solicitacao.pesquisador} · {solicitacao.linhagem} · {descreverAnimais(solicitacao)}
        </span>
        <Texto tom="secundario">
          {descreverIdade(solicitacao)} de idade · entrega em {formatarData(solicitacao.dataEntrega)}
        </Texto>
      </div>

      <EstadoDaConsulta consulta={atendimento} rotulo="Procurando as caixas…">
        {atendimento.data && (
          <>
            {candidatas.length === 0 ? (
              <Aviso tom="atencao" titulo="Nenhuma caixa tem animais para este pedido.">
                Não há animais na idade pedida, já desmamados até {formatarData(solicitacao.dataEntrega)}.
              </Aviso>
            ) : (
              <>
                <Texto tom="secundario">
                  Idade aceita na entrega: {atendimento.data.faixa.min} a{' '}
                  {atendimento.data.faixa.max} dias. Vem marcada a sugestão do sistema; dá para
                  trocar de caixa e mudar quantos reservar de cada uma.
                </Texto>
                <ul className="atender__lista">
                  {candidatas.map((caixa) => (
                    <Caixa
                      key={caixa.idParto}
                      caixa={caixa}
                      reserva={reserva[caixa.idParto]}
                      aoMarcar={(marcada) => marcar(caixa, marcada)}
                      aoMudar={(sexo, valor) => mudar(caixa, sexo, valor)}
                    />
                  ))}
                </ul>
              </>
            )}

            <Conferencia
              conferencia={conferencia}
              reservado={reservado}
              busca={atendimento.data}
            />
          </>
        )}
      </EstadoDaConsulta>
    </Modal>
  )
}

function Caixa({
  caixa,
  reserva,
  aoMarcar,
  aoMudar,
}: {
  caixa: CaixaCandidata
  reserva: PorSexo | undefined
  aoMarcar: (marcada: boolean) => void
  aoMudar: (sexo: keyof PorSexo, valor: number | null) => void
}) {
  const marcada = reserva !== undefined

  return (
    <li className={marcada ? 'atender__caixa atender__caixa--marcada' : 'atender__caixa'}>
      <Checkbox checked={marcada} onChange={(evento) => aoMarcar(evento.target.checked)}>
        <span className="atender__codigo">{caixa.codigo}</span>{' '}
        <Texto tom="secundario">{caixa.numeroVisivel}</Texto>
      </Checkbox>

      <div className="atender__ninhada">
        <span>
          {caixa.parto}º parto do casal {caixa.casal} · {caixa.idadeNaEntrega} dias na entrega
        </span>
        <Texto tom="secundario">
          {caixa.origem === 'de_fato' ? 'Já desmamados' : 'Desmamam até a entrega'} · livres:{' '}
          {caixa.disponivel.m} M · {caixa.disponivel.f} F
        </Texto>
      </div>

      {reserva && (
        <div className="atender__quantos">
          <label>
            <Texto tom="secundario">M</Texto>
            <InputNumber
              {...QUANTOS}
              max={caixa.disponivel.m}
              value={reserva.m}
              aria-label={`Machos a reservar da caixa ${caixa.codigo}`}
              onChange={(valor) => aoMudar('m', valor)}
            />
          </label>
          <label>
            <Texto tom="secundario">F</Texto>
            <InputNumber
              {...QUANTOS}
              max={caixa.disponivel.f}
              value={reserva.f}
              aria-label={`Fêmeas a reservar da caixa ${caixa.codigo}`}
              onChange={(valor) => aoMudar('f', valor)}
            />
          </label>
        </div>
      )}
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

  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}` : (partes[0] ?? '')
}

/** "Falta 1 macho", mas "Faltam 2 machos" e "Faltam 1 macho e 1 fêmea" */
function faltam(falta: Quantidades): string {
  const quantidades = [falta.machos, falta.femeas, falta.qualquer].filter((n) => n > 0)
  const singular = quantidades.length === 1 && quantidades[0] === 1
  return `${singular ? 'Falta' : 'Faltam'} ${porExtenso(falta)}.`
}

/** O total reservado contra o pedido; sem animais no plantel, o que resta fazer */
function Conferencia({
  conferencia,
  reservado,
  busca,
}: {
  conferencia: ConferenciaDaReserva
  reservado: PorSexo
  busca: ResultadoDaBusca
}) {
  if (conferencia.cobre) {
    return (
      <Aviso
        tom="sucesso"
        titulo={`Pedido coberto: ${porExtenso({ machos: reservado.m, femeas: reservado.f, qualquer: 0 })}.`}
      />
    )
  }

  const { falta, aMais } = conferencia
  const sobra =
    aMais.machos + aMais.femeas > 0
      ? porExtenso({ machos: aMais.machos, femeas: aMais.femeas, qualquer: 0 })
      : aMais.total > 0
        ? `${aMais.total} ${aMais.total === 1 ? 'animal' : 'animais'}`
        : null
  const titulo = [
    falta.machos + falta.femeas + falta.qualquer > 0 ? faltam(falta) : null,
    sobra ? `Há ${sobra} a mais.` : null,
  ]
    .filter((frase) => frase !== null)
    .join(' ')

  // o plantel todo não cobre: não adianta trocar de caixa
  const semAnimais = busca.deficit.m + busca.deficit.f + busca.deficit.qualquer > 0
  const casais = busca.casaisAFormar

  return (
    <Aviso tom="atencao" titulo={titulo}>
      {semAnimais
        ? `As caixas não têm animais para o pedido, então recuse com o motivo ou forme ${casais} ${casais === 1 ? 'casal novo: com ele' : 'casais novos: com eles'}, a entrega passa a ser possível a partir de ${formatarData(busca.acasalamentoNovo.dataMinimaDeEntrega)}.`
        : 'Ajuste as caixas marcadas até cobrir o pedido.'}
    </Aviso>
  )
}
