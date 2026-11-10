import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { App, Segmented } from 'antd'
import { createContext, useContext, useState } from 'react'
import type { DragEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Botao, CabecalhoDaTela, Linha, Pilha, Secao, Texto, Vazio } from '@/componentes'
import {
  corDoParto,
  descreverEstoque,
  FASE,
  motivoDoAtraso,
  SIMBOLO_DO_SEXO,
} from '@/dominio/caixa'
import { useCatalogo, useEstantes, useGrade, useMudarDePosicao } from '@/dominio/consultas'
import type { CaixaNaGrade, Estante, EstoqueNoCard, Grade, Posicao } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { motivoDaFalha } from '@/layout/useFalhaDoFormulario'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { descreverDias, formatarDataCurta } from '@/lib/data'
import { FichaDaCaixa } from './FichaDaCaixa'
import type { PosicaoVazia } from './FichaDaCaixa'
import { LegendaDasFases } from './FaseDaCaixa'
import { LegendaDosPartos } from './LegendaDosPartos'
import './Estantes.css'

/** O que a ficha abre: uma caixa, ou uma posição vazia onde a caixa vai nascer */
type Alvo = { idCaixa: number } | { vazia: PosicaoVazia }

/** A caixa pega pelo arraste, e de onde ela sai */
interface Pega {
  caixa: CaixaNaGrade
  codigo: string
  numeroVisivel: string
}

/** A caixa solta numa posição vazia: enquanto a API grava, ela já aparece no lugar novo */
interface Movimento {
  caixa: CaixaNaGrade
  destino: string
}

/** Arrastar a caixa para uma posição vazia, de qualquer estante da sala, muda ela de lugar */
interface Arraste {
  /** a caixa no ar; null fora do arraste */
  pega: Pega | null
  movimento: Movimento | null
  pegar: (pega: Pega) => void
  largar: () => void
  soltar: (destino: PosicaoVazia) => void
}

/**
 * A linhagem que a Visão geral mandou acender (?linhagem=), ou null: com ela, as caixas das outras
 * linhagens e as posições vazias ficam apagadas
 */
const LinhagemAcesa = createContext<number | null>(null)

/**
 * A tela do celular: a grade encolhe para caber as colunas da estante na largura, a célula mostra
 * só o código e o parto (ou o sexo e quantos, na de estoque), e ninguém arrasta. O arrastar do
 * navegador não funciona no toque: a caixa muda de lugar pela ficha, em Mudar de lugar
 */
const GradeEstreita = createContext(false)

/** O id da linhagem no endereço; qualquer outra coisa é sem filtro */
function linhagemDoEndereco(valor: string | null): number | null {
  const id = Number(valor)
  return valor !== null && Number.isInteger(id) && id > 0 ? id : null
}

/** O código da posição só não se repete dentro da estante */
const chaveDaPosicao = (idEstante: number, codigo: string) => `${idEstante}:${codigo}`

/** As estantes de cada sala, com as faces frontal e traseira lado a lado */
export function Estantes() {
  const { message } = App.useApp()
  const estantes = useEstantes()
  const mover = useMudarDePosicao()
  const [sala, setSala] = useState<string | null>(null)
  const [aberta, setAberta] = useState<Alvo | null>(null)
  const [pega, setPega] = useState<Pega | null>(null)
  const [movimento, setMovimento] = useState<Movimento | null>(null)
  const [parametros, setParametros] = useSearchParams()
  const linhagem = linhagemDoEndereco(parametros.get('linhagem'))
  const estreita = useTelaEstreita()
  // no celular a legenda fica atrás de um botão: aberta, ela empurra a grade para baixo
  const [comLegenda, setComLegenda] = useState(false)

  const lista = estantes.data ?? []
  const salas = [...new Set(lista.map((estante) => estante.sala))]
  const salaAtiva = sala ?? salas[0] ?? null

  function soltar(destino: PosicaoVazia) {
    setPega(null)
    if (pega === null || movimento !== null) return

    setMovimento({ caixa: pega.caixa, destino: chaveDaPosicao(destino.idEstante, destino.codigo) })
    mover.mutate(
      {
        idCaixa: pega.caixa.id,
        idEstante: destino.idEstante,
        face: destino.face,
        linha: destino.linha,
        coluna: destino.coluna,
      },
      {
        onSuccess: ({ codigo }) => {
          const texto =
            pega.numeroVisivel === destino.numeroVisivel
              ? `Caixa ${pega.codigo} movida para ${codigo}.`
              : `Caixa ${pega.codigo} da ${pega.numeroVisivel} movida para ${codigo} da ${destino.numeroVisivel}.`
          void message.success(texto)
        },
        // sem campo para destacar: o motivo vai no aviso
        onError: (erro) => void message.error(motivoDaFalha(erro)),
        // a mutação só termina depois que a grade recarrega, então a caixa não pisca de volta
        onSettled: () => setMovimento(null),
      },
    )
  }

  const arraste: Arraste = {
    pega,
    movimento,
    pegar: setPega,
    largar: () => setPega(null),
    soltar,
  }

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Infraestrutura"
        titulo="Estantes"
        descricao={
          estreita
            ? 'As duas faces de cada estante, como estão na sala. Toque numa caixa para abrir a ficha, ou numa posição vazia para formar um casal.'
            : 'As duas faces de cada estante, como estão na sala. Clique numa caixa para abrir a ficha, ou arraste para uma posição vazia para mudar de lugar. Numa posição vazia, clique para formar um casal.'
        }
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
                {estreita ? (
                  <Botao
                    icon={<InfoCircleOutlined />}
                    aria-expanded={comLegenda}
                    onClick={() => setComLegenda(!comLegenda)}
                  >
                    Legenda
                  </Botao>
                ) : (
                  <Legendas />
                )}
              </Linha>
              {estreita && comLegenda && <Legendas />}
              {linhagem !== null && (
                <FiltroDaLinhagem
                  idLinhagem={linhagem}
                  aoLimpar={() => {
                    parametros.delete('linhagem')
                    setParametros(parametros, { replace: true })
                  }}
                />
              )}
            </Secao>

            <GradeEstreita.Provider value={estreita}>
              <LinhagemAcesa.Provider value={linhagem}>
                {lista
                  .filter((estante) => estante.sala === salaAtiva)
                  .map((estante) => (
                    <CartaoDaEstante
                      key={estante.id}
                      estante={estante}
                      arraste={arraste}
                      aoAbrir={setAberta}
                    />
                  ))}
              </LinhagemAcesa.Provider>
            </GradeEstreita.Provider>
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

/** O que é cada cor de fundo, a borda vermelha e a bolinha do parto */
function Legendas() {
  return (
    <div className="estantes__legendas">
      <LegendaDasFases />
      <LegendaDosPartos />
    </div>
  )
}

/** "Só a linhagem Wistar", com o botão que volta a mostrar todas */
function FiltroDaLinhagem({ idLinhagem, aoLimpar }: { idLinhagem: number; aoLimpar: () => void }) {
  const catalogo = useCatalogo()
  const nome = catalogo.data?.especies
    .flatMap((especie) => especie.linhagens)
    .find((linhagem) => linhagem.id === idLinhagem)?.nome

  return (
    <div className="estantes__filtro">
      <span>{nome ? `Só a linhagem ${nome}` : 'Só uma linhagem'}</span>
      <button
        type="button"
        className="estantes__limpar"
        onClick={aoLimpar}
        aria-label="Mostrar todas as linhagens"
        title="Mostrar todas as linhagens"
      >
        <CloseOutlined />
      </button>
    </div>
  )
}

function CartaoDaEstante({
  estante,
  arraste,
  aoAbrir,
}: {
  estante: Estante
  arraste: Arraste
  aoAbrir: (alvo: Alvo) => void
}) {
  const grade = useGrade(estante.id)

  return (
    <Secao titulo={`${estante.numeroVisivel} · ${estante.fabricante} ${estante.modelo}`}>
      <EstadoDaConsulta consulta={grade} rotulo="Carregando a grade…">
        <div className="faces">
          {grade.data?.faces.map((face) => (
            <Face
              key={face.face}
              face={face}
              estante={estante}
              arraste={arraste}
              aoAbrir={aoAbrir}
            />
          ))}
        </div>
      </EstadoDaConsulta>
    </Secao>
  )
}

function Face({
  face,
  estante,
  arraste,
  aoAbrir,
}: {
  face: Grade['faces'][number]
  estante: Estante
  arraste: Arraste
  aoAbrir: (alvo: Alvo) => void
}) {
  const estreita = useContext(GradeEstreita)
  const posicoes = [...face.posicoes].sort((a, b) => a.linha - b.linha || a.coluna - b.coluna)
  const rotulo = face.face === 'frontal' ? 'Face frontal' : 'Face traseira'

  return (
    <section className="face" aria-label={rotulo}>
      <Texto tom="rotulo">{rotulo}</Texto>
      <div className="face__rolagem">
        <div
          className="face__grade"
          // no celular, 6 colunas cabem em 320 px; a estante mais larga rola de lado
          style={{
            gridTemplateColumns: `repeat(${estante.colunas}, minmax(${estreita ? 44 : 58}px, 1fr))`,
          }}
        >
          {posicoes.map((posicao) => (
            <Celula
              key={posicao.codigo}
              posicao={posicao}
              arraste={arraste}
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

/** " (50 e 30 dias)": as idades da caixa de estoque, do mais velho ao mais novo */
function idadesDoEstoque(estoque: EstoqueNoCard): string {
  const idades = estoque.grupos.map((grupo) => grupo.idadeDias)
  if (idades.length === 0) return ''

  const ultima = idades.pop()!
  return ` (${idades.length > 0 ? `${idades.join(', ')} e ` : ''}${descreverDias(ultima)})`
}

function Celula({
  posicao,
  vazia,
  arraste,
  aoAbrir,
}: {
  posicao: Posicao
  /** o endereço completo, para abrir a ficha de uma posição sem caixa ou soltar uma caixa nela */
  vazia: PosicaoVazia
  arraste: Arraste
  aoAbrir: (alvo: Alvo) => void
}) {
  const [sobre, setSobre] = useState(false)
  const acesa = useContext(LinhagemAcesa)
  const estreita = useContext(GradeEstreita)
  const { movimento } = arraste
  const chegando =
    movimento?.destino === chaveDaPosicao(vazia.idEstante, posicao.codigo) ? movimento.caixa : null
  const saindo = posicao.caixa !== null && posicao.caixa.id === movimento?.caixa.id
  const caixa = chegando ?? (saindo ? null : posicao.caixa)

  if (!caixa) {
    const recebe = arraste.pega !== null

    const aceitar = (evento: DragEvent<HTMLButtonElement>) => {
      if (!recebe) return
      evento.preventDefault()
      evento.dataTransfer.dropEffect = 'move'
    }

    return (
      <button
        type="button"
        className={`posicao posicao--vazia${recebe ? ' posicao--destino' : ''}${recebe && sobre ? ' posicao--sobre' : ''}${acesa !== null && !recebe ? ' posicao--apagada' : ''}`}
        title={`${posicao.codigo}: posição vazia - clique para formar um casal`}
        // a caixa ainda está sendo gravada no lugar novo: aqui ainda não dá para formar casal
        disabled={saindo}
        onClick={() => aoAbrir({ vazia })}
        onDragEnter={(evento) => {
          aceitar(evento)
          setSobre(true)
        }}
        onDragOver={aceitar}
        onDragLeave={() => setSobre(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          setSobre(false)
          arraste.soltar(vazia)
        }}
      >
        <span className="posicao__codigo">{posicao.codigo}</span>
      </button>
    )
  }

  const { fase } = caixa
  const atraso = motivoDoAtraso(caixa)
  const erguida = arraste.pega?.caixa.id === caixa.id
  const classes = [
    'posicao',
    fase ? `posicao--${fase}` : '',
    caixa.atrasado ? 'posicao--atrasado' : '',
    erguida ? 'posicao--erguida' : '',
    chegando ? 'posicao--movendo' : '',
    acesa !== null && caixa.idLinhagem !== acesa ? 'posicao--apagada' : '',
  ].filter(Boolean)

  // div e não button: o Firefox não arrasta button
  return (
    <div
      className={classes.join(' ')}
      role="button"
      tabIndex={0}
      aria-busy={chegando !== null}
      title={`${posicao.codigo}: ${
        caixa.estoque
          ? `caixa de estoque, ${descreverEstoque(caixa.estoque)}${idadesDoEstoque(caixa.estoque)}`
          : fase
            ? FASE[fase].legenda
            : 'sem ciclo aberto'
      }${atraso ? `. ${atraso}` : ''} - ${estreita ? 'toque para abrir a ficha' : 'clique para abrir a ficha, arraste para mudar de lugar'}`}
      draggable={movimento === null && !estreita}
      onDragStart={(evento) => {
        evento.dataTransfer.setData('text/plain', String(caixa.id))
        evento.dataTransfer.effectAllowed = 'move'
        arraste.pegar({ caixa, codigo: posicao.codigo, numeroVisivel: vazia.numeroVisivel })
      }}
      onDragEnd={arraste.largar}
      onClick={() => aoAbrir({ idCaixa: caixa.id })}
      onKeyDown={(evento) => {
        if (evento.key !== 'Enter' && evento.key !== ' ') return
        evento.preventDefault()
        aoAbrir({ idCaixa: caixa.id })
      }}
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
        {caixa.estoque && (
          <span className="posicao__sexo" title={descreverEstoque(caixa.estoque)}>
            {SIMBOLO_DO_SEXO[caixa.estoque.sexo]} {caixa.estoque.total}
          </span>
        )}
      </span>
      {caixa.linhagem && <span className="posicao__linhagem">{caixa.linhagem}</span>}
      {caixa.casal && <span className="posicao__casal">{caixa.casal.identificacao}</span>}
      {fase === 'acasalado' && caixa.casal?.partoPrevisto && (
        <span className="posicao__previsto">
          <span className="posicao__previstoRotulo">parto </span>
          {formatarDataCurta(caixa.casal.partoPrevisto)}
        </span>
      )}
      {caixa.casal && caixa.casal.reservado > 0 && (
        <span className="posicao__casal">{caixa.casal.reservado} res.</span>
      )}
      {caixa.estoque && caixa.estoque.reservado > 0 && (
        <span className="posicao__casal">{caixa.estoque.reservado} res.</span>
      )}
    </div>
  )
}
