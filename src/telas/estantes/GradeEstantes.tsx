import { Alert, Card, Empty, Select, Space, Statistic, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { config } from '@/app/config'
import { Legenda } from '@/dominio/Legenda'
import { porLinha } from '@/dominio/estante'
import type { Estante, FaceDaGrade, Grade } from '@/dominio/estante'
import { Carregando } from '@/layout/Carregando'
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

  return (
    <section className="face" aria-label={ROTULO_FACE[face.face] ?? face.face}>
      <Typography.Text className="face__titulo">{ROTULO_FACE[face.face] ?? face.face}</Typography.Text>
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

  if (estantes.isLoading) return <Carregando rotulo="Carregando as estantes…" />

  if (estantes.error && !semApi) {
    return <Alert type="error" showIcon message={(estantes.error as Error).message} />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Grade de estantes
        </Typography.Title>
        <Typography.Text type="secondary">
          As duas faces da estante, como ela está na sala. Clique numa caixa para abrir a ficha.
        </Typography.Text>
      </div>

      {semApi && (
        <Alert
          type="warning"
          showIcon
          message="Dados de demonstração"
          description="A API não respondeu, então a grade abaixo é gerada localmente a partir das topologias do Anexo A. Nenhum número aqui é dado do CPMR."
        />
      )}

      <Space size={12} wrap align="end">
        <div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            Estante
          </Typography.Text>
          <Select<number>
            {...(idAtual === null ? {} : { value: idAtual })}
            onChange={setIdSelecionado}
            style={{ minWidth: 320 }}
            options={lista.map((e) => ({
              value: e.id,
              label: `${e.numeroVisivel} · ${e.sala} · ${e.fabricante} ${e.modelo} (${e.topologia.capacidade} posições)`,
            }))}
          />
        </div>

        {/* RF-INF-06 — capacidade instalada, ocupada e livre: insumo direto
            para decidir se cabe acasalamento novo. */}
        {estanteAtual && (
          <Space size={24}>
            <Statistic title="Capacidade" value={estanteAtual.ocupacao.capacidade} />
            <Statistic title="Ocupada" value={estanteAtual.ocupacao.ocupada} />
            <Statistic title="Livre" value={estanteAtual.ocupacao.livre} />
          </Space>
        )}
      </Space>

      <Card size="small" title="Legenda">
        <Legenda />
      </Card>

      {grade.isLoading && !semApi && <Carregando rotulo="Carregando a grade…" />}

      {grade.error && !semApi && (
        <Alert type="error" showIcon message={(grade.error as Error).message} />
      )}

      {gradeAtual ? (
        <Card
          size="small"
          title={`${gradeAtual.estante.numeroVisivel} · ${gradeAtual.estante.sala} · ${gradeAtual.estante.fabricante} ${gradeAtual.estante.modelo}`}
        >
          <div className="faces">
            {gradeAtual.faces.map((face) => (
              <FaceDaEstante key={face.face} face={face} aoAbrir={abrirFicha} />
            ))}
          </div>
        </Card>
      ) : (
        !grade.isLoading && <Empty description="Nenhuma estante cadastrada." />
      )}
    </Space>
  )
}
