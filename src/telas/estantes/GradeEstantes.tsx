import { useMemo, useState } from 'react'
import {
  Aviso,
  BarraDeFiltros,
  CabecalhoDaTela,
  CampoDeFiltro,
  EstadoDaConsulta,
  Legenda,
  PainelDeIndicadores,
  Pilha,
  Recolhivel,
  Secao,
  SeletorDeEstante,
  Texto,
  Vazio,
} from '@/componentes'
import { config } from '@/app/config'
import { porLinha } from '@/dominio/estante'
import type { Estante, FaceDaGrade, Grade } from '@/dominio/estante'
import { ErroDeRede } from '@/lib/api'
import { CardDaPosicao } from './CardDaPosicao'
import { ESTANTES_DEMO, gradeDemo } from './demonstracao'
import { useEstantes, useGrade } from './useEstantes'
import './grade.css'

const ROTULO_FACE: Record<string, string> = { frontal: 'Face frontal', traseira: 'Face traseira' }

function FaceDaEstante({
  face,
  aoAbrir,
}: {
  face: FaceDaGrade
  aoAbrir: (idCaixa: number) => void
}) {
  const linhas = porLinha(face)
  const rotulo = ROTULO_FACE[face.face] ?? face.face

  return (
    <section className="face" aria-label={rotulo}>
      <Texto tom="rotulo">{rotulo}</Texto>
      <div className="face__rolagem">
        <div
          className="face__grade"
          style={{ gridTemplateColumns: `repeat(${face.colunas}, minmax(58px, 1fr))` }}
        >
          {linhas.flat().map((posicao) => (
            <CardDaPosicao key={posicao.codigo} posicao={posicao} aoAbrir={aoAbrir} />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * `RF-INF-03` — visão espacial da ocupação.
 *
 * "Reproduzindo a estante real com as duas faces visíveis ao mesmo tempo.
 * Comunica de relance: vazia, com casal, estágio do ciclo, situação de
 * comprometimento."
 *
 * A grade **não é gerada aqui**. O `contrato-api.md` §5 é explícito: como não
 * existe tabela `slot` (decisão D-04 do modelo de dados), o back-end monta as
 * posições a partir da topologia e devolve as vazias com `caixa: null`. O front
 * desenha o que recebe — `RNF-01`.
 *
 * A legenda fica recolhida: quem usa a tela todo dia aprende os cinco estados
 * na primeira semana, e um bloco fixo de explicação rouba altura da grade,
 * que é o que a tela existe para mostrar. Aberta por um clique, e sem esconder
 * nada que decida — o card já carrega marcador e sigla (`RNF-10`).
 */
export function GradeEstantes() {
  const estantes = useEstantes()
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null)

  // Só cai em demonstração por falha de rede, e nunca em produção. Erro de
  // contrato (401, 403, 500) é erro e aparece como erro.
  const semApi = estantes.error instanceof ErroDeRede && config.ambiente !== 'producao'

  const lista: Estante[] = semApi ? ESTANTES_DEMO : (estantes.data ?? [])
  const idAtual = idSelecionado ?? lista[0]?.id ?? null
  const estanteAtual = lista.find((e) => e.id === idAtual) ?? null

  const grade = useGrade(semApi ? null : idAtual)

  const gradeAtual: Grade | null = useMemo(() => {
    if (semApi) return estanteAtual ? gradeDemo(estanteAtual) : null
    return grade.data ?? null
  }, [semApi, estanteAtual, grade.data])

  function abrirFicha(idCaixa: number) {
    // Card "Ficha da posição em modal" (RF-INF-04 + RF-REP-02), próximo do
    // backlog. Abre daqui e do quadro, com o mesmo componente.
    console.info('Abrir ficha da caixa', idCaixa)
  }

  // Em demonstração a consulta falhou de propósito: não passar por
  // EstadoDaConsulta, senão a tela mostraria o aviso em vez da grade.
  if (!semApi) {
    return (
      <EstadoDaConsulta consulta={estantes} rotulo="Carregando as estantes…">
        {conteudo()}
      </EstadoDaConsulta>
    )
  }

  return conteudo()

  function conteudo() {
    return (
      <Pilha>
        <CabecalhoDaTela
          titulo="Grade de estantes"
          rotulo="Infraestrutura"
          descricao="As duas faces da estante, como ela está na sala. Clique numa caixa para abrir a ficha."
        />

        {semApi && (
          <Aviso tom="atencao" titulo="Dados de demonstração">
            A API não respondeu, então a grade abaixo é gerada localmente a partir das topologias do
            Anexo A. Nenhum número aqui é dado do CPMR.
          </Aviso>
        )}

        <Secao>
          <BarraDeFiltros>
            <CampoDeFiltro rotulo="Estante" largura={360}>
              {(id) => (
                <SeletorDeEstante
                  id={id}
                  estantes={lista}
                  value={idAtual}
                  onChange={setIdSelecionado}
                  carregando={estantes.isPending}
                />
              )}
            </CampoDeFiltro>
          </BarraDeFiltros>
        </Secao>

        {/* RF-INF-06 — capacidade instalada, ocupada e livre: insumo direto
            para decidir se cabe acasalamento novo. Na faixa invertida porque
            é o número que o técnico consulta antes de montar casal. */}
        {estanteAtual && (
          <PainelDeIndicadores
            invertido
            indicadores={[
              {
                rotulo: 'Capacidade',
                valor: estanteAtual.ocupacao.capacidade,
                ajuda: 'Posições instaladas nas duas faces desta estante.',
              },
              { rotulo: 'Ocupada', valor: estanteAtual.ocupacao.ocupada },
              {
                rotulo: 'Livre',
                valor: estanteAtual.ocupacao.livre,
                emDestaque: true,
                ajuda: 'Calculada no servidor. O front não subtrai nada.',
              },
            ]}
          />
        )}

        {!semApi && !gradeAtual && (
          <EstadoDaConsulta consulta={grade} rotulo="Carregando a grade…">
            <></>
          </EstadoDaConsulta>
        )}

        {gradeAtual ? (
          <Secao
            titulo={`${gradeAtual.estante.numeroVisivel} · ${gradeAtual.estante.sala} · ${gradeAtual.estante.fabricante} ${gradeAtual.estante.modelo}`}
          >
            <Pilha espaco={12}>
              <Recolhivel
                paineis={[{ chave: 'legenda', titulo: 'Legenda', conteudo: <Legenda /> }]}
              />
              <div className="faces">
                {gradeAtual.faces.map((face) => (
                  <FaceDaEstante key={face.face} face={face} aoAbrir={abrirFicha} />
                ))}
              </div>
            </Pilha>
          </Secao>
        ) : (
          !grade.isPending && <Vazio descricao="Nenhuma estante cadastrada." />
        )}
      </Pilha>
    )
  }
}
