import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { agruparPorIdade, frasePorSexo, type GrupoDeIdade } from '@/dominio/idades'
import type { IdadeNaVisaoGeral } from '@/dominio/tipos'
import { COR } from './coresDaVisao'

/** Sem medida (o jsdom dos testes não mede nada) o gráfico nasce com esta largura */
const MEDIDA_INICIAL = { width: 320, height: 200 }

const SUPERFICIE = 'var(--cor-cartao)'

interface LinhaDaDica {
  cor: string
  texto: string
}

/** O tooltip escuro: um título e linhas com a bolinha da cor */
function Dica({ titulo, linhas }: { titulo: string; linhas: LinhaDaDica[] }) {
  return (
    <div className="visao__dica">
      <strong className="visao__dicaTitulo">{titulo}</strong>
      {linhas.map((linha) => (
        <div key={linha.texto} className="visao__dicaLinha">
          <span className="visao__dicaBolinha" style={{ background: linha.cor }} />
          {linha.texto}
        </div>
      ))}
    </div>
  )
}

/** O dado da barra apontada: o gráfico o manda em `payload` */
function dadoApontado<T>({ active, payload }: TooltipContentProps): T | null {
  if (!active || !payload?.length) return null
  return (payload[0]!.payload ?? null) as T | null
}

export function LegendaDeCores({ itens }: { itens: { cor: string; nome: string }[] }) {
  return (
    <ul className="visao__legenda">
      {itens.map((item) => (
        <li key={item.nome}>
          <span className="visao__legendaCor" style={{ background: item.cor }} />
          {item.nome}
        </li>
      ))}
    </ul>
  )
}

/** O gráfico principal: barras ♂ e ♀ lado a lado, um grupo por idade, com o número em cima */
export function BarrasPorIdade({
  idades,
  linhagem,
}: {
  idades: IdadeNaVisaoGeral[]
  linhagem: string
}) {
  const grupos = agruparPorIdade(idades)
  const resumo = `${linhagem}, livres por idade: ${grupos
    .map((g) => `${g.nome}: ${frasePorSexo(g)}`)
    .join('; ')}`

  return (
    <div className="visao__grafico" role="img" aria-label={resumo}>
      <ResponsiveContainer width="100%" height={200} initialDimension={MEDIDA_INICIAL}>
        <BarChart data={grupos} margin={{ top: 20, right: 4, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="rotulo" tickLine={false} interval={0} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ zIndex: 10 }}
            content={(props) => {
              const grupo = dadoApontado<GrupoDeIdade>(props)
              if (!grupo) return null
              return (
                <Dica
                  titulo={`${grupo.nome}: ${frasePorSexo(grupo)}`}
                  linhas={[
                    { cor: COR.machos, texto: `♂ ${grupo.m}` },
                    { cor: COR.femeas, texto: `♀ ${grupo.f}` },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey="m"
            name="Machos"
            fill={COR.machos}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList position="top" className="visao__valorDaBarra" />
          </Bar>
          <Bar
            dataKey="f"
            name="Fêmeas"
            fill={COR.femeas}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList position="top" className="visao__valorDaBarra" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface FatiaDaRosca {
  nome: string
  valor: number
  cor: string
}

/** A rosca: as fatias, o total de vivos no centro e, ao apontar ou tocar uma fatia, o nome e a % */
export function RoscaDeSituacao({ fatias, total }: { fatias: FatiaDaRosca[]; total: number }) {
  const [ativa, setAtiva] = useState<number | null>(null)
  const fatia = ativa === null ? null : fatias[ativa]
  const resumo = `Situação dos vivos: ${fatias.map((f) => `${f.valor} ${f.nome.toLowerCase()}`).join(', ')}`

  return (
    <div className="visao__rosca" role="img" aria-label={resumo}>
      <div className="visao__roscaAro">
        <ResponsiveContainer width="100%" height={200} initialDimension={MEDIDA_INICIAL}>
          <PieChart>
            <Pie
              data={fatias}
              dataKey="valor"
              nameKey="nome"
              innerRadius={64}
              outerRadius={96}
              paddingAngle={fatias.filter((f) => f.valor > 0).length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive={false}
              onMouseLeave={() => setAtiva(null)}
            >
              {fatias.map((f, i) => (
                <Cell
                  key={f.nome}
                  fill={f.cor}
                  onMouseEnter={() => setAtiva(i)}
                  onClick={() => setAtiva(ativa === i ? null : i)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="visao__roscaCentro">
          <span className="visao__roscaValor">{fatia ? fatia.valor : total}</span>
          <span className="visao__roscaRotulo">{fatia ? fatia.nome : 'vivos'}</span>
          {fatia && total > 0 && (
            <span className="visao__roscaPorcento">
              {((fatia.valor / total) * 100).toFixed(1).replace('.', ',')}%
            </span>
          )}
        </div>
      </div>
      <LegendaDeCores itens={fatias.map((f) => ({ cor: f.cor, nome: f.nome }))} />
    </div>
  )
}

export interface VivosDaLinhagem {
  linhagem: string
  reservados: number
  livres: number
  total: number
}

/** Vivos por linhagem: reservados e livres empilhados, o total em cima */
export function BarrasDeVivos({ linhagens }: { linhagens: VivosDaLinhagem[] }) {
  const resumo = `Vivos por linhagem: ${linhagens
    .map((l) => `${l.linhagem} ${l.total} (${l.reservados} reservados, ${l.livres} livres)`)
    .join('; ')}`

  return (
    <div className="visao__grafico" role="img" aria-label={resumo}>
      <ResponsiveContainer width="100%" height={200} initialDimension={MEDIDA_INICIAL}>
        <BarChart data={linhagens} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="linhagem" tickLine={false} interval={0} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ zIndex: 10 }}
            content={(props) => {
              const l = dadoApontado<VivosDaLinhagem>(props)
              if (!l) return null
              return (
                <Dica
                  titulo={`${l.linhagem}: ${l.total} vivos`}
                  linhas={[
                    { cor: COR.reservados, texto: `${l.reservados} reservados` },
                    { cor: COR.livres, texto: `${l.livres} livres` },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey="reservados"
            stackId="vivos"
            fill={COR.reservados}
            stroke={SUPERFICIE}
            strokeWidth={2}
            maxBarSize={48}
            isAnimationActive={false}
          />
          <Bar
            dataKey="livres"
            stackId="vivos"
            fill={COR.livres}
            stroke={SUPERFICIE}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            isAnimationActive={false}
          >
            <LabelList dataKey="total" position="top" className="visao__valorDaBarra" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <LegendaDeCores
        itens={[
          { cor: COR.reservados, nome: 'Reservados' },
          { cor: COR.livres, nome: 'Livres' },
        ]}
      />
    </div>
  )
}
