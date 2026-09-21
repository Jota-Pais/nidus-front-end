import type { ReactNode } from 'react'
import { ESTADO_CAIXA } from '@/dominio/estados'
import { MarcaGrauCerteza } from '@/dominio/Legenda'
import type { CardDoQuadro } from '@/dominio/quadro'
import type { EstadoCaixa } from '@/dominio/tipos'
import { IndicadorDeCiclo } from '../IndicadorDeCiclo'
import { MarcaDeAtraso } from '../MarcaDeAtraso'
import { ProximoEvento } from '../ProximoEvento'
import { QuantidadePorSexo } from '../QuantidadePorSexo'
import './estilos.css'

/** O card de uma caixa no quadro de comprometimento - RF-CIC-04 */
export function CardDaCaixa({
  card,
  estado,
  aoAbrir,
  acoes,
}: {
  card: CardDoQuadro
  /** vem da coluna: o contrato não repete o estado dentro de cada card */
  estado: EstadoCaixa
  aoAbrir?: (idCaixa: number) => void
  /** ex: o BotaoDeMoverEstado. Fica fora do botão que abre a ficha */
  acoes?: ReactNode
}) {
  const visual = ESTADO_CAIXA[estado]
  const atrasado = card.proximoEvento?.atrasado === true

  const leitura = [
    `Posição ${card.codigo} na estante ${card.numeroVisivel}, ${card.sala}`,
    card.linhagem,
    visual.rotulo,
    card.casal
      ? `casal ${card.casal.identificacao}, ciclo ${card.casal.cicloAtual} de ${card.casal.maxCiclos}`
      : 'sem casal ativo',
    `disponível ${card.disponivel.m} machos e ${card.disponivel.f} fêmeas`,
  ].join('. ')

  return (
    <article
      className={`cardDaCaixa cardDaCaixa--${estado}${atrasado ? ' cardDaCaixa--atrasado' : ''}`}
    >
      <button
        type="button"
        className="cardDaCaixa__area"
        onClick={aoAbrir ? () => aoAbrir(card.idCaixa) : undefined}
        disabled={!aoAbrir}
        aria-label={leitura}
      >
        <header className="cardDaCaixa__topo">
          <span className="cardDaCaixa__codigo">{card.codigo}</span>
          <span className="cardDaCaixa__estante">{card.numeroVisivel}</span>
          {/* Segundo canal: forma. O terceiro é a sigla, no rodapé. */}
          <span className="cardDaCaixa__marcador" aria-hidden="true">
            {visual.marcador}
          </span>
        </header>

        <p className="cardDaCaixa__linhagem">{card.linhagem}</p>

        <div className="cardDaCaixa__casal">
          {card.casal ? (
            <>
              <span className="cardDaCaixa__par">{card.casal.identificacao}</span>
              <IndicadorDeCiclo
                atual={card.casal.cicloAtual}
                maximo={card.casal.maxCiclos}
                compacto
              />
            </>
          ) : (
            <span className="cardDaCaixa__semCasal">Sem casal ativo</span>
          )}
        </div>

        <div className="cardDaCaixa__oferta">
          <QuantidadePorSexo valor={card.disponivel} />
          <MarcaGrauCerteza grau={card.grauCerteza} />
        </div>

        <footer className="cardDaCaixa__rodape">
          <span className="cardDaCaixa__sigla">{visual.sigla}</span>
          {/* A marca de atraso fica no canto do card, uma vez só. */}
          <ProximoEvento evento={card.proximoEvento} semRotulo semMarcaDeAtraso />
        </footer>
      </button>

      {atrasado && (
        <span className="cardDaCaixa__alerta">
          <MarcaDeAtraso compacta />
        </span>
      )}

      {acoes && <div className="cardDaCaixa__acoes">{acoes}</div>}
    </article>
  )
}
