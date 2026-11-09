// A estante desenhada, para clicar no lugar dos animais: a caixa de estoque que os recebe ou uma
// posição vazia, que vira caixa de estoque nova. O que não serve fica apagado. É um campo de
// formulário: o Form.Item dá o valor (o lugar clicado) e recebe a mudança
import { Segmented } from 'antd'
import { useState } from 'react'
import { Texto } from '@/componentes'
import { contarDoSexo, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import type { LugarNaEstante } from '@/dominio/caixa'
import { useEstantes, useGrade } from '@/dominio/consultas'
import type { CaixaNaGrade, Estante, Posicao, Sexo } from '@/dominio/tipos'
import './EscolherCaixa.css'

/** Quem a caixa de estoque tem de aceitar, e onde mais dá para clicar */
interface Filtro {
  sexo: Sexo
  /**
   * as linhagens que os animais podem ter: a caixa de estoque que recebe é de uma delas. Quase
   * sempre uma só; na anulação, a de cada casal que passou pela caixa, porque o evento da baixa
   * não diz de qual eram os animais. A que ainda não se sabe (null, o catálogo não chegou) não
   * casa com nenhuma caixa
   */
  linhagens: readonly (number | null)[]
  /** a posição vazia vira caixa nova (a mudança); sem ela, só a caixa que já existe recebe */
  aceitaVazia: boolean
  /** a caixa de onde os animais saem não recebe a si mesma */
  idOrigem: number
  /** o lugar que o outro sexo já pegou na mesma ação: machos e fêmeas não dividem a caixa */
  doOutroSexo: LugarNaEstante | null
}

const OS_DO_SEXO: Record<Sexo, string> = { M: 'os machos', F: 'as fêmeas' }
const OUTRO_SEXO: Record<Sexo, Sexo> = { M: 'F', F: 'M' }

/** A caixa de estoque do sexo e da linhagem dos animais, que não é a de onde eles saem */
function recebe(caixa: CaixaNaGrade, filtro: Filtro): boolean {
  const estoque = caixa.estoque
  return (
    estoque !== null &&
    estoque.sexo === filtro.sexo &&
    estoque.idLinhagem !== null &&
    filtro.linhagens.includes(estoque.idLinhagem) &&
    caixa.id !== filtro.idOrigem
  )
}

export function EscolherCaixa({
  sala,
  numeroVisivel,
  sexo,
  linhagens,
  aceitaVazia,
  idOrigem,
  doOutroSexo = null,
  value = null,
  onChange,
  id,
}: {
  /** a sala e a estante que abrem primeiro: as da caixa de onde os animais saem */
  sala: string
  numeroVisivel: string
  sexo: Sexo
  linhagens: readonly (number | null)[]
  aceitaVazia: boolean
  idOrigem: number
  doOutroSexo?: LugarNaEstante | null | undefined
  value?: LugarNaEstante | null | undefined
  onChange?: ((lugar: LugarNaEstante) => void) | undefined
  id?: string | undefined
}) {
  const estantes = useEstantes()
  const [idEstante, setIdEstante] = useState<number | null>(value?.idEstante ?? null)
  const daSala = (estantes.data ?? []).filter((estante) => estante.sala === sala)
  const aberta =
    daSala.find((estante) => estante.id === idEstante) ??
    daSala.find((estante) => estante.numeroVisivel === numeroVisivel) ??
    daSala[0]

  if (!aberta) {
    return (
      <Texto tom="secundario">
        {estantes.isPending ? 'Carregando as estantes…' : 'Nenhuma estante na sala.'}
      </Texto>
    )
  }

  return (
    <div className="escolherCaixa" id={id}>
      {daSala.length > 1 && (
        <Segmented<number>
          size="small"
          value={aberta.id}
          onChange={setIdEstante}
          options={daSala.map((estante) => ({ value: estante.id, label: estante.numeroVisivel }))}
        />
      )}
      <MiniGrade
        estante={aberta}
        filtro={{ sexo, linhagens, aceitaVazia, idOrigem, doOutroSexo }}
        escolhida={value}
        aoEscolher={(lugar) => onChange?.(lugar)}
      />
    </div>
  )
}

/** O que a célula diz, para o título e para o leitor de tela */
function tituloDa(posicao: Posicao, filtro: Filtro, doOutro: boolean): string {
  const { caixa, codigo } = posicao

  if (caixa === null) {
    if (doOutro) return `${codigo}: já escolhida para ${OS_DO_SEXO[OUTRO_SEXO[filtro.sexo]]}`
    return filtro.aceitaVazia
      ? `${codigo}: posição vazia, vira caixa de estoque nova`
      : `${codigo}: posição vazia`
  }
  if (caixa.id === filtro.idOrigem) return `${codigo}: a caixa de onde os animais saem`
  if (recebe(caixa, filtro) && caixa.estoque) {
    return `${codigo}: caixa de estoque com ${contarDoSexo(caixa.estoque.total, filtro.sexo)}`
  }
  return `${codigo}: ocupada`
}

/**
 * A estante em miniatura. Dá para clicar na caixa de estoque do sexo e da linhagem dos animais
 * e, quando a ação cria caixa, na posição vazia; o resto fica apagado. A posição vazia que o outro
 * sexo já pegou mostra o símbolo dele
 */
function MiniGrade({
  estante,
  filtro,
  escolhida,
  aoEscolher,
}: {
  estante: Estante
  filtro: Filtro
  escolhida: LugarNaEstante | null
  aoEscolher: (lugar: LugarNaEstante) => void
}) {
  const grade = useGrade(estante.id)

  if (grade.isPending) return <Texto tom="secundario">Carregando a estante…</Texto>

  const naPosicao = (lugar: LugarNaEstante | null, codigo: string) =>
    lugar !== null && lugar.idEstante === estante.id && lugar.codigo === codigo

  return (
    <div className="miniGrade">
      {(grade.data?.faces ?? []).map((face) => (
        <div key={face.face} className="miniGrade__face">
          <span className="miniGrade__rotulo">
            {face.face === 'frontal' ? 'Frontal' : 'Traseira'}
          </span>
          <div
            className="miniGrade__celulas"
            style={{ gridTemplateColumns: `repeat(${estante.colunas}, minmax(0, 1fr))` }}
          >
            {[...face.posicoes]
              .sort((a, b) => a.linha - b.linha || a.coluna - b.coluna)
              .map((posicao) => {
                const { caixa } = posicao
                const vazia = caixa === null
                const doOutro = vazia && naPosicao(filtro.doOutroSexo, posicao.codigo)
                const estoque = caixa !== null && recebe(caixa, filtro) ? caixa.estoque : null
                const livre = vazia && filtro.aceitaVazia && !doOutro
                const marcada = naPosicao(escolhida, posicao.codigo)
                const titulo = tituloDa(posicao, filtro, doOutro)

                return (
                  <button
                    key={posicao.codigo}
                    type="button"
                    className={[
                      'miniGrade__celula',
                      livre ? 'miniGrade__celula--vazia' : '',
                      estoque ? 'miniGrade__celula--estoque' : '',
                      marcada ? 'miniGrade__celula--marcada' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={titulo}
                    aria-label={titulo}
                    aria-pressed={marcada}
                    disabled={!(estoque || livre)}
                    onClick={() =>
                      aoEscolher({
                        idEstante: estante.id,
                        codigo: posicao.codigo,
                        face: face.face,
                        linha: posicao.linha,
                        coluna: posicao.coluna,
                        idCaixa: estoque && caixa ? caixa.id : null,
                      })
                    }
                  >
                    {estoque
                      ? `${SIMBOLO_DO_SEXO[filtro.sexo]}${estoque.total}`
                      : doOutro
                        ? SIMBOLO_DO_SEXO[OUTRO_SEXO[filtro.sexo]]
                        : posicao.codigo}
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
