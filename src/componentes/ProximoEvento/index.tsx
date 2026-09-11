import { ROTULO_EVENTO } from '@/dominio/estante'
import type { ProximoEvento as ProximoEventoDoContrato } from '@/dominio/estante'
import { Data } from '../Data'
import { MarcaDeAtraso } from '../MarcaDeAtraso'
import './estilos.css'

/**
 * O que vai acontecer nesta caixa, e quando.
 *
 * Vem pronto do contrato (`proximoEvento` na grade e no card do quadro): tipo,
 * data e se está atrasado. O front não escolhe qual evento é o próximo — essa
 * é a cadeia temporal do `RN-05`, e ela é do servidor.
 *
 * Quando `atrasado` é verdadeiro, a marca de atraso entra junto: a data
 * sozinha não diz que ela já passou, e é justamente a passagem despercebida
 * que o `RF-REP-07` chama de erosão silenciosa.
 */
export function ProximoEvento({
  evento,
  semRotulo = false,
  semMarcaDeAtraso = false,
}: {
  evento: ProximoEventoDoContrato | null | undefined
  /** Só a data, para coluna de tabela que já tem o tipo no cabeçalho. */
  semRotulo?: boolean
  /**
   * Suprime a marca de atraso — **só** onde ela já está sendo mostrada ao
   * lado, como no canto do `CardDaCaixa`. Duas marcas iguais no mesmo card
   * são anunciadas duas vezes pelo leitor de tela, e um alerta repetido é um
   * alerta que se aprende a ignorar. A data em vermelho continua valendo.
   */
  semMarcaDeAtraso?: boolean
}) {
  if (!evento) return <span className="proximoEvento__vazio">Sem evento previsto</span>

  return (
    <span className={`proximoEvento${evento.atrasado ? ' proximoEvento--atrasado' : ''}`}>
      {!semRotulo && (
        <span className="proximoEvento__tipo">{ROTULO_EVENTO[evento.tipo]}</span>
      )}
      <Data valor={evento.data} />
      {evento.atrasado && !semMarcaDeAtraso && <MarcaDeAtraso />}
    </span>
  )
}
