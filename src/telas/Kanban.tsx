import { Segmented } from 'antd'
import { useState } from 'react'
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
import type { CardDoKanban, CasalNoCard, CodigoEspecie, EstadoCaixa } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { descreverDias, formatarDataCurta } from '@/lib/data'
import { FichaDaCaixa } from './FichaDaCaixa'
import { LegendaDosPartos } from './LegendaDosPartos'
import './Kanban.css'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Ratos' },
  { value: 'camundongo', label: 'Camundongos' },
]

/**
 * Kanban de reprodução: um quadro por espécie, quatro colunas, só de leitura. Ninguém muda a caixa
 * de coluna: a do casal fica em Livres, dizendo quantos reservados tem, e a de estoque muda
 * sozinha, pelo que tem reservado
 */
export function Kanban() {
  const [especie, setEspecie] = useState<CodigoEspecie>('rato')
  const kanban = useKanban(especie)
  const [idFicha, setIdFicha] = useState<number | null>(null)

  const colunas = COLUNAS.map((coluna) => ({
    ...coluna,
    cards: kanban.data?.colunas.find((c) => c.estado === coluna.estado)?.cards ?? [],
  }))

  const total = colunas.reduce((soma, coluna) => soma + coluna.cards.length, 0)

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Reprodução"
        titulo="Kanban"
        descricao="Um quadro por espécie. A caixa de casal fica em Livres e diz quantos animais reservados tem; a de estoque muda de coluna sozinha, pelo que tem reservado. Clique no card para abrir a ficha."
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

function statusDoCard(casal: CasalNoCard | null, estado: EstadoCaixa): string[] {
  if (!casal) return [estado === 'livres' ? 'Sem casal ativo' : COLUNA[estado].legenda]

  const partes = situacaoDoCasal(casal, estado)
  if (casal.reservado === 0) return partes

  return [...partes, `${casal.reservado} ${casal.reservado === 1 ? 'reservado' : 'reservados'}`]
}

function situacaoDoCasal(casal: CasalNoCard, estado: EstadoCaixa): string[] {
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

function Card({ card, estado, aoAbrir }: { card: CardDoKanban; estado: EstadoCaixa; aoAbrir: () => void }) {
  const { casal, estoque } = card
  // a caixa enviada já está vazia: o card só lembra para onde ela foi
  const comAnimais = estoque !== null && estado !== 'enviado'

  return (
    <div
      className={`kanban__card kanban__card--${estado}`}
      onClick={aoAbrir}
      onKeyDown={(evento) => evento.key === 'Enter' && aoAbrir()}
      role="button"
      tabIndex={0}
      title="Clique para abrir a ficha"
    >
      <div className="kanban__topo">
        {/* a caixa enviada já não ocupa a posição: o endereço vai entre parênteses */}
        <span className="kanban__codigo">{estado === 'enviado' ? `(${card.codigo})` : card.codigo}</span>
        <span className="kanban__estante">{card.numeroVisivel}</span>
        {casal && (
          <span className="parto kanban__parto" title={`Parto em curso: ${casal.partoAtual}º`}>
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

      {comAnimais && <p className="kanban__linhagem">{descreverEstoque(estoque)}</p>}

      {comAnimais && estoque.grupos.length > 0 && (
        // dentro da caixa só a idade separa os animais: um grupo por data de nascimento
        <ul className="kanban__ninhadas kanban__idades" aria-label="Idades na caixa">
          {estoque.grupos.map((grupo) => (
            <li key={grupo.dtNascimento}>
              <span>{descreverDias(grupo.idadeDias)}</span>
              <span>
                {grupo.total}
                {grupo.reservados > 0 && ` · ${grupo.reservados} res.`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {casal && (
        <div className="kanban__casal">
          <span>{casal.identificacao}</span>
          {casal.partoPrevisto && (
            <span title={`Previsão do ${casal.partoAtual}º parto`}>
              P: {formatarDataCurta(casal.partoPrevisto)}
            </span>
          )}
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
              <span>
                {descreverDias(ninhada.idadeDias)}
                {ninhada.mamando && ' · mamando'}
              </span>
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
