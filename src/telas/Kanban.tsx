import { Segmented } from 'antd'
import { useState } from 'react'
import type { DragEvent } from 'react'
import { CabecalhoDaTela, Etiqueta, Linha, Pilha, Secao } from '@/componentes'
import {
  COLUNA,
  COLUNAS,
  contarDoSexo,
  corDoParto,
  descreverEstoque,
  MAX_PARTOS_POR_CASAL,
  SIMBOLO_DO_SEXO,
} from '@/dominio/caixa'
import { useKanban } from '@/dominio/consultas'
import type { CardDoKanban, CodigoEspecie, EstadoCaixa } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { descreverDias, idadeEmDias } from '@/lib/data'
import { FichaDaCaixa } from './FichaDaCaixa'
import { LegendaDosPartos } from './LegendaDosPartos'
import { useMudarDeColuna } from './useMudarDeColuna'
import './Kanban.css'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Ratos' },
  { value: 'camundongo', label: 'Camundongos' },
]

/** Card que acabou de ser solto numa coluna e ainda está sendo gravado */
interface Movimento {
  card: CardDoKanban
  destino: EstadoCaixa
}

/** Kanban de reprodução: um quadro por espécie, cinco colunas, arrastar muda a coluna */
export function Kanban() {
  const [especie, setEspecie] = useState<CodigoEspecie>('rato')
  const kanban = useKanban(especie)
  const mudarDeColuna = useMudarDeColuna()
  const [movimento, setMovimento] = useState<Movimento | null>(null)
  const [idFicha, setIdFicha] = useState<number | null>(null)

  // Enquanto grava, o card já aparece na coluna nova
  const colunas = COLUNAS.map((coluna) => {
    const doServidor = kanban.data?.colunas.find((c) => c.estado === coluna.estado)?.cards ?? []
    const cards = doServidor.filter((card) => card.idCaixa !== movimento?.card.idCaixa)
    if (movimento?.destino === coluna.estado) cards.push(movimento.card)
    return { ...coluna, cards }
  })

  const total = colunas.reduce((soma, coluna) => soma + coluna.cards.length, 0)

  function soltar(evento: DragEvent<HTMLElement>, destino: EstadoCaixa) {
    const idCaixa = Number(evento.dataTransfer.getData('text/plain'))
    const origem = colunas.find((coluna) => coluna.cards.some((card) => card.idCaixa === idCaixa))
    const card = origem?.cards.find((c) => c.idCaixa === idCaixa)
    // a caixa de estoque nao se arrasta: a coluna dela sai do que esta reservado
    if (!card || card.estoque || origem?.estado === destino) return

    setMovimento({ card, destino })
    mudarDeColuna(card.idCaixa, destino, () => setMovimento(null))
  }

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Reprodução"
        titulo="Kanban"
        descricao="Um quadro por espécie. A caixa de casal alterna entre Livres e Pré-reserva arrastando; a de estoque muda de coluna sozinha, pelo que tem reservado. Clique no card para abrir a ficha."
        acoes={<Etiqueta>{total} caixas</Etiqueta>}
      />

      <Secao>
        <Linha distribuicao="space-between" estilo={{ flexWrap: 'wrap', rowGap: 12 }}>
          <Segmented<CodigoEspecie> value={especie} onChange={setEspecie} options={ESPECIES} size="large" />
          <LegendaDosPartos />
        </Linha>
      </Secao>

      <EstadoDaConsulta consulta={kanban} rotulo="Carregando o kanban…">
        <div className="kanban">
          {colunas.map((coluna) => (
            <section
              key={coluna.estado}
              className={`kanban__coluna kanban__coluna--${coluna.estado}`}
              onDragOver={(evento) => evento.preventDefault()}
              onDrop={(evento) => soltar(evento, coluna.estado)}
              aria-label={`${coluna.rotulo}: ${coluna.cards.length} caixas`}
            >
              <header className="kanban__colunaCabecalho">
                <span>{coluna.rotulo}</span>
                <span className="kanban__total">{coluna.cards.length}</span>
              </header>

              <div className="kanban__cards">
                {coluna.cards.length === 0 && <p className="kanban__vazia">Nenhuma caixa.</p>}
                {coluna.cards.map((card) => (
                  <Card
                    key={card.idCaixa}
                    card={card}
                    estado={coluna.estado}
                    aoAbrir={() => setIdFicha(card.idCaixa)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </EstadoDaConsulta>

      <FichaDaCaixa idCaixa={idFicha} aoFechar={() => setIdFicha(null)} />
    </Pilha>
  )
}


function statusDoCard(casal: CardDoKanban['casal'], estado: EstadoCaixa): string[] {
  if (!casal) return [estado === 'livres' ? 'Sem casal ativo' : COLUNA[estado].legenda]

  const aguardando = casal.aguardandoDesmame ? 'Aguardando desmame' : null

  if (casal.encerrado && estado === 'livres') {
    return aguardando ? ['Casal encerrado', aguardando] : ['Casal encerrado']
  }

  if (casal.encerrado) {
    return [
      COLUNA[estado].legenda,
      aguardando ? 'Casal encerrado aguardando desmame' : 'Casal encerrado',
    ]
  }

  return casal.partoAtual >= MAX_PARTOS_POR_CASAL
    ? [COLUNA[estado].legenda, 'Último parto']
    : [COLUNA[estado].legenda]
}
/** A idade dos animais da caixa de estoque hoje: "28 dias", ou "25 a 31 dias" com idades diferentes */
function idadeDoEstoque(estoque: NonNullable<CardDoKanban['estoque']>): string | null {
  if (!estoque.nascimentoDe || !estoque.nascimentoAte) return null

  const maisVelho = idadeEmDias(estoque.nascimentoDe)
  const maisNovo = idadeEmDias(estoque.nascimentoAte)

  return maisVelho === maisNovo ? descreverDias(maisVelho) : `${maisNovo} a ${descreverDias(maisVelho)}`
}

function Card({ card, estado, aoAbrir }: { card: CardDoKanban; estado: EstadoCaixa; aoAbrir: () => void }) {
  const { casal, estoque } = card
  const idade = estoque ? idadeDoEstoque(estoque) : null

  return (
    <div
      className={`kanban__card kanban__card--${estado}`}
      draggable={!estoque}
      onDragStart={(evento) => evento.dataTransfer.setData('text/plain', String(card.idCaixa))}
      onClick={aoAbrir}
      onKeyDown={(evento) => evento.key === 'Enter' && aoAbrir()}
      role="button"
      tabIndex={0}
      title={
        estoque
          ? 'Caixa de estoque: clique para abrir a ficha. Ela muda de coluna sozinha, pelo que tem reservado'
          : 'Clique para abrir a ficha; arraste para mudar de coluna'
      }
    >
      <div className="kanban__topo">
        {/* a caixa enviada ja nao ocupa a posicao: o endereco vai entre parenteses */}
        <span className="kanban__codigo">{estado === 'enviado' ? `(${card.codigo})` : card.codigo}</span>
        <span className="kanban__estante">{card.numeroVisivel}</span>
        {casal && (
          <span className="parto kanban__parto" title={`Parto atual: ${casal.partoAtual}º`}>
            <span
              className="bolinhaDeParto"
              style={{ backgroundColor: corDoParto(casal.partoAtual).cor }}
            />
            {casal.partoAtual}º
          </span>
        )}
        {estoque && (
          <span className="kanban__parto" title={contarDoSexo(estoque.total, estoque.sexo)}>
            {SIMBOLO_DO_SEXO[estoque.sexo]} {estoque.total}
          </span>
        )}
      </div>

      {card.linhagem && <p className="kanban__linhagem">{card.linhagem}</p>}

      {estoque && estado !== 'enviado' && (
        <p className="kanban__linhagem">
          {descreverEstoque(estoque)}
          {idade && ` · ${idade}`}
        </p>
      )}

      {casal && (
        <div className="kanban__casal">
          <span>{casal.identificacao}</span>
        </div>
      )}

      {casal && casal.ninhadas.length > 0 && (
        <ul className="kanban__ninhadas" aria-label="Animais na caixa">
          {casal.ninhadas.map((ninhada, indice) => (
            // o mesmo parto pode vir de dois casais: a ninhada de um casal de antes leva o nome dele
            <li key={`${indice}-${ninhada.casal}-${ninhada.parto}`}>
              <span>
                {ninhada.casal !== casal.identificacao && `${ninhada.casal} `}
                {ninhada.parto}º
              </span>
              <span>
                {ninhada.m} M · {ninhada.f} F
              </span>
              <span>{descreverDias(ninhada.idadeDias)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="kanban__status">
        {statusDoCard(casal, estado).map((parte, indice) =>
          indice === 0 ? (
            parte
          ) : (
            <span key={parte} className="kanban__ultimoParto">
              {` · ${parte}`}
            </span>
          ),
        )}
      </div>
    </div>
  )
}
