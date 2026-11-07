import { Segmented } from 'antd'
import { useState } from 'react'
import { CabecalhoDaTela, Linha, Pilha, Secao, Texto, Vazio } from '@/componentes'
import { COLUNA, corDoParto, pintaNaGrade } from '@/dominio/caixa'
import { useEstantes, useGrade } from '@/dominio/consultas'
import type { Estante, Grade, Posicao } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { FichaDaCaixa } from './FichaDaCaixa'
import type { PosicaoVazia } from './FichaDaCaixa'
import { LegendaDosPartos } from './LegendaDosPartos'
import './Estantes.css'

/** O que a ficha abre: uma caixa, ou uma posição vazia onde a caixa vai nascer */
type Alvo = { idCaixa: number } | { vazia: PosicaoVazia }

/** As estantes de cada sala, com as faces frontal e traseira lado a lado */
export function Estantes() {
  const estantes = useEstantes()
  const [sala, setSala] = useState<string | null>(null)
  const [aberta, setAberta] = useState<Alvo | null>(null)

  const lista = estantes.data ?? []
  const salas = [...new Set(lista.map((estante) => estante.sala))]
  const salaAtiva = sala ?? salas[0] ?? null

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Infraestrutura"
        titulo="Estantes"
        descricao="As duas faces de cada estante, como estão na sala. Clique numa caixa para abrir a ficha, ou numa posição vazia para formar um casal."
      />

      <EstadoDaConsulta consulta={estantes} rotulo="Carregando as estantes…">
        {salas.length === 0 ? (
          <Vazio descricao="Nenhuma estante cadastrada." />
        ) : (
          <>
            <Secao>
              <Linha distribuicao="space-between" estilo={{ flexWrap: 'wrap', rowGap: 12 }}>
                <Segmented<string>
                  {...(salaAtiva ? { value: salaAtiva } : {})}
                  onChange={setSala}
                  options={salas}
                  size="large"
                />
                <LegendaDosPartos />
              </Linha>
            </Secao>

            {lista
              .filter((estante) => estante.sala === salaAtiva)
              .map((estante) => (
                <CartaoDaEstante key={estante.id} estante={estante} aoAbrir={setAberta} />
              ))}
          </>
        )}
      </EstadoDaConsulta>

      <FichaDaCaixa
        idCaixa={aberta && 'idCaixa' in aberta ? aberta.idCaixa : null}
        posicaoVazia={aberta && 'vazia' in aberta ? aberta.vazia : null}
        aoFechar={() => setAberta(null)}
      />
    </Pilha>
  )
}

function CartaoDaEstante({ estante, aoAbrir }: { estante: Estante; aoAbrir: (alvo: Alvo) => void }) {
  const grade = useGrade(estante.id)

  return (
    <Secao titulo={`${estante.numeroVisivel} · ${estante.fabricante} ${estante.modelo}`}>
      <EstadoDaConsulta consulta={grade} rotulo="Carregando a grade…">
        <div className="faces">
          {grade.data?.faces.map((face) => (
            <Face key={face.face} face={face} estante={estante} aoAbrir={aoAbrir} />
          ))}
        </div>
      </EstadoDaConsulta>
    </Secao>
  )
}

function Face({
  face,
  estante,
  aoAbrir,
}: {
  face: Grade['faces'][number]
  estante: Estante
  aoAbrir: (alvo: Alvo) => void
}) {
  const posicoes = [...face.posicoes].sort((a, b) => a.linha - b.linha || a.coluna - b.coluna)
  const rotulo = face.face === 'frontal' ? 'Face frontal' : 'Face traseira'

  return (
    <section className="face" aria-label={rotulo}>
      <Texto tom="rotulo">{rotulo}</Texto>
      <div className="face__rolagem">
        <div
          className="face__grade"
          style={{ gridTemplateColumns: `repeat(${estante.colunas}, minmax(58px, 1fr))` }}
        >
          {posicoes.map((posicao) => (
            <Celula
              key={posicao.codigo}
              posicao={posicao}
              aoAbrir={aoAbrir}
              vazia={{
                idEstante: estante.id,
                face: face.face,
                linha: posicao.linha,
                coluna: posicao.coluna,
                codigo: posicao.codigo,
                sala: estante.sala,
                numeroVisivel: estante.numeroVisivel,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Celula({
  posicao,
  vazia,
  aoAbrir,
}: {
  posicao: Posicao
  /** o endereço completo, para abrir a ficha de uma posição sem caixa */
  vazia: PosicaoVazia
  aoAbrir: (alvo: Alvo) => void
}) {
  const { caixa } = posicao

  if (!caixa) {
    return (
      <button
        type="button"
        className="posicao posicao--vazia"
        title={`${posicao.codigo}: posição vazia - clique para formar um casal`}
        onClick={() => aoAbrir({ vazia })}
      >
        <span className="posicao__codigo">{posicao.codigo}</span>
      </button>
    )
  }

  const pinta = pintaNaGrade(caixa.estado, caixa.casal !== null)

  return (
    <button
      type="button"
      className={`posicao${pinta ? ` posicao--${caixa.estado}` : ''}`}
      title={`${posicao.codigo}: ${pinta ? COLUNA[caixa.estado].legenda : 'sem casal'}`}
      onClick={() => aoAbrir({ idCaixa: caixa.id })}
    >
      <span className="posicao__topo">
        <span className="posicao__codigo">{posicao.codigo}</span>
        {caixa.casal && (
          <span className="parto" title={`Parto atual: ${caixa.casal.partoAtual}º`}>
            <span
              className="bolinhaDeParto"
              style={{ backgroundColor: corDoParto(caixa.casal.partoAtual).cor }}
            />
            {caixa.casal.partoAtual}º
          </span>
        )}
      </span>
      {caixa.linhagem && <span className="posicao__linhagem">{caixa.linhagem}</span>}
      {caixa.casal && <span className="posicao__casal">{caixa.casal.identificacao}</span>}
    </button>
  )
}
