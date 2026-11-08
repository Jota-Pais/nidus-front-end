// A caixa de estoque na ficha. Depois do desmame os filhotes saem da caixa do casal para caixas de
// estoque, cada uma com um sexo e uma linhagem; qualquer posição vazia vira uma. Aqui ficam a
// ficha da caixa de estoque, os desmamados do parto com o "Passar para o estoque", e a caixa do
// casal encerrado que vira de estoque no lugar
import { App, InputNumber, Segmented } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, Texto } from '@/componentes'
import { COLUNA, contarDoSexo, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import {
  useEstantes,
  useGrade,
  usePassarParaOEstoque,
  useVirarCaixaDeEstoque,
} from '@/dominio/consultas'
import type { DestinoDoEstoque, PassagemParaOEstoque } from '@/dominio/consultas'
import type { Estante, Face, FichaDeEstoque, Parto, PorSexo, Sexo } from '@/dominio/tipos'
import { motivoDaFalha } from '@/layout/useFalhaDoFormulario'
import { descreverDias, formatarData, idadeEmDias } from '@/lib/data'
import { Campo, LadoALado } from './CamposDaFicha'
import './EstoqueDaFicha.css'

/** "28 dias", ou "25 a 31 dias" quando as idades são diferentes */
function idadeDe(nascimentoDe: string | null, nascimentoAte: string | null): string {
  if (!nascimentoDe || !nascimentoAte) return '—'

  const maisVelho = idadeEmDias(nascimentoDe)
  const maisNovo = idadeEmDias(nascimentoAte)

  return maisVelho === maisNovo
    ? descreverDias(maisVelho)
    : `${maisNovo} a ${descreverDias(maisVelho)}`
}

const ROTULO_DO_SEXO: Record<Sexo, string> = { M: 'Machos', F: 'Fêmeas' }

// ------------------------------------------------------------ a ficha da caixa de estoque

export function FichaDoEstoque({ ficha }: { ficha: FichaDeEstoque }) {
  const { caixa } = ficha
  const enviada = caixa.estado === 'enviado'

  return (
    <div className="ficha__aba">
      <div className="ficha__casal">
        {enviada
          ? 'Caixa de estoque enviada: a entrega levou os últimos animais e a posição ficou livre.'
          : `Caixa de estoque · ${COLUNA[caixa.estado].legenda}. Os animais saem dela na entrega; quando ela esvaziar, a posição fica livre.`}
      </div>

      <LadoALado>
        <Campo rotulo="Sexo">
          {SIMBOLO_DO_SEXO[caixa.sexo]} {ROTULO_DO_SEXO[caixa.sexo]}
        </Campo>
        <Campo rotulo="Linhagem">{caixa.linhagem ?? '—'}</Campo>
        <Campo rotulo="Idade hoje">{idadeDe(ficha.nascimentoDe, ficha.nascimentoAte)}</Campo>
      </LadoALado>

      <LadoALado>
        <Campo rotulo="Animais" destaque>
          {ficha.total}
        </Campo>
        <Campo rotulo="Reservados">{ficha.reservado}</Campo>
        <Campo rotulo="Livres">{ficha.livre}</Campo>
      </LadoALado>

      <h3>De onde vieram</h3>
      {ficha.lotes.length === 0 ? (
        <p className="ficha__vazio">Nenhum animal na caixa.</p>
      ) : (
        <ul className="ficha__lotes">
          {ficha.lotes.map((lote) => (
            <li key={lote.idParto}>
              <strong>{contarDoSexo(lote.qtd, caixa.sexo)}</strong>
              <span>
                {lote.ordem}º parto do casal {lote.casal}, caixa {lote.origem.codigo} (
                {lote.origem.numeroVisivel})
              </span>
              <span>
                {lote.dtNascimento
                  ? `nascidos em ${formatarData(lote.dtNascimento)}, ${descreverDias(lote.idadeDias ?? 0)}`
                  : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Reservados para</h3>
      {ficha.pedidos.length === 0 ? (
        <p className="ficha__vazio">Nenhum animal desta caixa está reservado.</p>
      ) : (
        <ul className="ficha__lotes">
          {ficha.pedidos.map((pedido) => (
            <li key={pedido.idSolicitacao}>
              <strong>Pedido #{pedido.idSolicitacao}</strong>
              <span>{contarDoSexo(pedido.qtd, caixa.sexo)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ------------------------------------------------------------ os desmamados do parto

/** A caixa do casal de onde saem os desmamados: o endereço, para abrir a estante dela */
interface CaixaDoCasal {
  endereco: { numeroVisivel: string; sala: string }
}

const deSexo = (porSexo: PorSexo, sexo: Sexo) => (sexo === 'M' ? porSexo.m : porSexo.f)

/** Onde estão os desmamados do parto, e a passagem da caixa do casal para o estoque */
export function DesmamadosDoParto({
  idCaixa,
  caixa,
  linhagem,
  parto,
}: {
  idCaixa: number
  caixa: CaixaDoCasal
  /** a linhagem do casal que teve o parto: a caixa de estoque que recebe tem de ser a mesma */
  linhagem: string | null
  parto: Parto
}) {
  const [aberto, setAberto] = useState(false)
  const { naCaixa, noEstoque } = parto
  const sobrou = naCaixa.m + naCaixa.f > 0

  return (
    <>
      <h3>Para onde foram</h3>
      <LadoALado>
        <Campo rotulo="Na caixa do casal" destaque={sobrou}>
          {naCaixa.m} M · {naCaixa.f} F
        </Campo>
        <Campo rotulo="No estoque">
          {noEstoque.length === 0
            ? '—'
            : noEstoque
                .map(
                  (caixa) =>
                    `${SIMBOLO_DO_SEXO[caixa.sexo]} ${caixa.qtd} em ${caixa.codigo} (${caixa.numeroVisivel})`,
                )
                .join(' · ')}
        </Campo>
      </LadoALado>

      {sobrou &&
        (aberto ? (
          <PassarParaOEstoque
            idCaixa={idCaixa}
            caixa={caixa}
            linhagem={linhagem}
            parto={parto}
            aoTerminar={() => setAberto(false)}
          />
        ) : (
          <div>
            <Botao variante="primario" onClick={() => setAberto(true)}>
              Passar para o estoque
            </Botao>
          </div>
        ))}
    </>
  )
}

/** A caixa clicada na estante: uma de estoque que já existe (idCaixa) ou uma posição vazia */
interface Escolha {
  idEstante: number
  codigo: string
  face: Face
  linha: number
  coluna: number
  idCaixa: number | null
}

const OUTRO_SEXO: Record<Sexo, Sexo> = { M: 'F', F: 'M' }

/** "para os machos" / "para as fêmeas" */
const OS_DO_SEXO: Record<Sexo, string> = { M: 'os machos', F: 'as fêmeas' }

/**
 * Para cada sexo, quantos animais e um clique na caixa onde vão: uma posição vazia vira caixa de
 * estoque nova, e uma caixa de estoque do mesmo sexo e linhagem recebe mais animais
 */
function PassarParaOEstoque({
  idCaixa,
  caixa,
  linhagem,
  parto,
  aoTerminar,
}: {
  idCaixa: number
  caixa: CaixaDoCasal
  linhagem: string | null
  parto: Parto
  aoTerminar: () => void
}) {
  const { message } = App.useApp()
  const passar = usePassarParaOEstoque(idCaixa)
  const [erro, setErro] = useState<string | null>(null)
  const [qtd, setQtd] = useState<Record<Sexo, number>>({ M: parto.naCaixa.m, F: parto.naCaixa.f })
  const [escolha, setEscolha] = useState<Partial<Record<Sexo, Escolha>>>({})
  const sexos = (['M', 'F'] as const).filter((sexo) => deSexo(parto.naCaixa, sexo) > 0)

  const semCaixa = sexos.some((sexo) => qtd[sexo] > 0 && !escolha[sexo])
  const nenhum = sexos.every((sexo) => qtd[sexo] === 0)

  function passarAgora() {
    setErro(null)
    const pedido: PassagemParaOEstoque = { idParto: parto.id }

    for (const sexo of sexos) {
      const onde = escolha[sexo]
      if (qtd[sexo] === 0 || !onde) continue

      const destino: DestinoDoEstoque =
        onde.idCaixa !== null
          ? { idCaixa: onde.idCaixa }
          : {
              posicao: {
                idEstante: onde.idEstante,
                face: onde.face,
                linha: onde.linha,
                coluna: onde.coluna,
              },
            }
      pedido[sexo === 'M' ? 'machos' : 'femeas'] = { qtd: qtd[sexo], destino }
    }

    // mutateAsync, e não o retorno do mutate: quando todos saem da caixa do casal, a ficha
    // recarregada já não mostra esta passagem, e o React Query não chama o retorno do mutate de
    // quem saiu da tela
    passar.mutateAsync(pedido).then(
      ({ caixas }) => {
        const feitas = caixas.map(
          (feita) => `${contarDoSexo(feita.qtd, feita.sexo)} para a ${feita.codigo}`,
        )
        void message.success(`${feitas.join(' e ')}.`)
        aoTerminar()
      },
      (falha: Error) => setErro(motivoDaFalha(falha)),
    )
  }

  return (
    <div className="ficha__formulario passagem">
      {erro && <Aviso tom="erro" titulo={erro} />}
      {sexos.map((sexo) => {
        const maximo = deSexo(parto.naCaixa, sexo)

        return (
          <div key={sexo} className="passagem__sexo" role="group" aria-label={ROTULO_DO_SEXO[sexo]}>
            <div className="passagem__quantos">
              <span className="passagem__rotulo">
                {SIMBOLO_DO_SEXO[sexo]} {ROTULO_DO_SEXO[sexo]}
              </span>
              <InputNumber
                aria-label={`Quantos ${ROTULO_DO_SEXO[sexo].toLowerCase()}`}
                min={0}
                max={maximo}
                precision={0}
                value={qtd[sexo]}
                onChange={(valor) => setQtd({ ...qtd, [sexo]: valor ?? 0 })}
              />
              <span className="passagem__de">de {maximo}</span>
            </div>
            {qtd[sexo] > 0 && (
              <EscolherCaixa
                sexo={sexo}
                caixa={caixa}
                linhagem={linhagem}
                escolhida={escolha[sexo] ?? null}
                doOutroSexo={escolha[OUTRO_SEXO[sexo]] ?? null}
                aoEscolher={(onde) => setEscolha({ ...escolha, [sexo]: onde })}
              />
            )}
          </div>
        )
      })}
      <div className="ficha__botoes">
        <Botao
          variante="primario"
          onClick={passarAgora}
          loading={passar.isPending}
          disabled={semCaixa || nenhum}
        >
          Passar para o estoque
        </Botao>
        <Botao variante="fantasma" onClick={aoTerminar}>
          Cancelar
        </Botao>
      </div>
    </div>
  )
}

/** As estantes da sala da caixa do casal, abrindo na dela, para clicar na caixa de destino */
function EscolherCaixa({
  sexo,
  caixa,
  linhagem,
  escolhida,
  doOutroSexo,
  aoEscolher,
}: {
  sexo: Sexo
  caixa: CaixaDoCasal
  linhagem: string | null
  escolhida: Escolha | null
  doOutroSexo: Escolha | null
  aoEscolher: (onde: Escolha) => void
}) {
  const estantes = useEstantes()
  const [idEstante, setIdEstante] = useState<number | null>(null)
  const daSala = (estantes.data ?? []).filter((estante) => estante.sala === caixa.endereco.sala)
  const aberta =
    daSala.find((estante) => estante.id === idEstante) ??
    daSala.find((estante) => estante.numeroVisivel === caixa.endereco.numeroVisivel) ??
    daSala[0]

  if (!aberta) {
    return (
      <Texto tom="secundario">
        {estantes.isPending ? 'Carregando as estantes…' : 'Nenhuma estante na sala.'}
      </Texto>
    )
  }

  return (
    <div className="passagem__estante">
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
        sexo={sexo}
        linhagem={linhagem}
        escolhida={escolhida}
        doOutroSexo={doOutroSexo}
        aoEscolher={aoEscolher}
      />
    </div>
  )
}

/**
 * A estante em miniatura. Dá para clicar na posição vazia e na caixa de estoque do mesmo sexo e
 * linhagem; o resto fica apagado. A posição vazia que o outro sexo já pegou mostra o símbolo dele
 */
function MiniGrade({
  estante,
  sexo,
  linhagem,
  escolhida,
  doOutroSexo,
  aoEscolher,
}: {
  estante: Estante
  sexo: Sexo
  linhagem: string | null
  escolhida: Escolha | null
  doOutroSexo: Escolha | null
  aoEscolher: (onde: Escolha) => void
}) {
  const grade = useGrade(estante.id)

  if (grade.isPending) return <Texto tom="secundario">Carregando a estante…</Texto>

  const naPosicao = (onde: Escolha | null, codigo: string) =>
    onde !== null && onde.idEstante === estante.id && onde.codigo === codigo

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
                const ocupante = posicao.caixa
                const vazia = ocupante === null
                const estoque =
                  ocupante?.estoque &&
                  ocupante.estoque.sexo === sexo &&
                  ocupante.linhagem === linhagem
                    ? ocupante.estoque
                    : null
                const doOutro = vazia && naPosicao(doOutroSexo, posicao.codigo)
                const marcada = naPosicao(escolhida, posicao.codigo)
                const titulo = estoque
                  ? `${posicao.codigo}: caixa de estoque com ${contarDoSexo(estoque.total, sexo)}`
                  : doOutro
                    ? `${posicao.codigo}: já escolhida para ${OS_DO_SEXO[OUTRO_SEXO[sexo]]}`
                    : vazia
                      ? `${posicao.codigo}: posição vazia, vira caixa de estoque nova`
                      : `${posicao.codigo}: ocupada`

                return (
                  <button
                    key={posicao.codigo}
                    type="button"
                    className={[
                      'miniGrade__celula',
                      vazia && !doOutro ? 'miniGrade__celula--vazia' : '',
                      estoque ? 'miniGrade__celula--estoque' : '',
                      marcada ? 'miniGrade__celula--marcada' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={titulo}
                    aria-label={titulo}
                    aria-pressed={marcada}
                    disabled={!(estoque || (vazia && !doOutro))}
                    onClick={() =>
                      aoEscolher({
                        idEstante: estante.id,
                        codigo: posicao.codigo,
                        face: face.face,
                        linha: posicao.linha,
                        coluna: posicao.coluna,
                        idCaixa: estoque && ocupante ? ocupante.id : null,
                      })
                    }
                  >
                    {estoque
                      ? `${SIMBOLO_DO_SEXO[sexo]}${estoque.total}`
                      : doOutro
                        ? SIMBOLO_DO_SEXO[OUTRO_SEXO[sexo]]
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

// ------------------------------------------------------------ virar caixa de estoque

/**
 * A caixa do casal encerrado que ficou só com desmamados de um sexo pode virar caixa de estoque
 * ali mesmo, sem mudar os animais de lugar
 */
export function VirarCaixaDeEstoque({
  idCaixa,
  sexo,
  total,
}: {
  idCaixa: number
  sexo: Sexo
  total: number
}) {
  const { message, modal } = App.useApp()
  const virar = useVirarCaixaDeEstoque()

  function confirmar() {
    modal.confirm({
      title: 'Virar caixa de estoque?',
      content: `A caixa passa a ser a caixa de estoque destas ${contarDoSexo(total, sexo)} e sai da reprodução. Casal novo vai em outra posição.`,
      okText: 'Virar caixa de estoque',
      cancelText: 'Cancelar',
      onOk: () =>
        virar.mutateAsync(idCaixa).then(
          () => void message.success('A caixa virou caixa de estoque.'),
          (erro: Error) => void message.error(erro.message),
        ),
    })
  }

  return (
    <Aviso
      tom="informacao"
      titulo={`Sobraram na caixa só desmamados de um sexo: ${contarDoSexo(total, sexo)}`}
    >
      <p>Ela pode virar caixa de estoque aqui mesmo, sem mudar os animais de lugar.</p>
      <Botao onClick={confirmar} loading={virar.isPending}>
        Virar caixa de estoque
      </Botao>
    </Aviso>
  )
}
