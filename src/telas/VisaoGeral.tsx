import { Link } from 'react-router-dom'
import { CabecalhoDaTela, Pilha, Secao, Texto, Vazio } from '@/componentes'
import { SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useVisaoGeral } from '@/dominio/consultas'
import type {
  CodigoEspecie,
  EspecieNaVisaoGeral,
  LinhagemNaVisaoGeral,
  PorSexo,
} from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { COR, LEGENDA_SEXOS } from './coresDaVisao'
import { BarrasDeVivos, BarrasPorIdade, LegendaDeCores, RoscaDeSituacao } from './graficosDaVisao'
import './VisaoGeral.css'

/** A colônia de relance: o estoque livre de cada linhagem por sexo e idade, e o resto da situação */
export function VisaoGeral() {
  const visao = useVisaoGeral()

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Colônia"
        titulo="Visão geral"
        descricao="Quantos animais livres cada linhagem tem, de cada sexo e de cada idade, para atender os pedidos."
      />

      <EstadoDaConsulta consulta={visao} rotulo="Contando os animais…">
        {visao.data?.especies.map((especie) => (
          <Especie key={especie.codigo} especie={especie} />
        ))}
      </EstadoDaConsulta>
    </Pilha>
  )
}

/** O nome da seção: a API manda o da espécie no singular ("Rato"), e a seção conta animais */
const TITULO: Record<CodigoEspecie, string> = { rato: 'Ratos', camundongo: 'Camundongos' }

const somar = (a: PorSexo, b: PorSexo): PorSexo => ({ m: a.m + b.m, f: a.f + b.f })

const NADA: PorSexo = { m: 0, f: 0 }

const quantos = ({ m, f }: PorSexo) => m + f

/** Os números da espécie: a soma das linhagens */
function totalDaEspecie(linhagens: LinhagemNaVisaoGeral[]) {
  return linhagens.reduce(
    (total, l) => ({
      casais: total.casais + l.casais,
      mamando: somar(total.mamando, l.mamando),
      reservados: somar(total.reservados, l.reservados),
      livres: somar(total.livres, l.livres),
    }),
    { casais: 0, mamando: NADA, reservados: NADA, livres: NADA },
  )
}

function Especie({ especie }: { especie: EspecieNaVisaoGeral }) {
  const { linhagens } = especie
  const titulo = TITULO[especie.codigo] ?? especie.nome

  if (linhagens.length === 0) {
    return (
      <Secao titulo={titulo}>
        <Vazio descricao="Nenhuma linhagem nesta espécie." />
      </Secao>
    )
  }

  const total = totalDaEspecie(linhagens)
  const reservados = quantos(total.reservados)
  const livres = quantos(total.livres)

  return (
    <Secao titulo={titulo}>
      <div className="visao__especie">
        <dl className="visao__cartoes" aria-label={`Totais de ${titulo}`}>
          <CartaoDeNumero rotulo="Livres" cor={COR.livres} numero={livres} sexos={total.livres} />
          <CartaoDeNumero
            rotulo="Reservados"
            cor={COR.reservados}
            numero={reservados}
            sexos={total.reservados}
          />
          <CartaoDeNumero
            rotulo="Em aleitamento"
            cor="var(--fase-mamando-texto)"
            numero={quantos(total.mamando)}
            sexos={total.mamando}
          />
          <CartaoDeNumero rotulo="Casais ativos" numero={total.casais} />
        </dl>

        <ul className="visao__linhagens" aria-label={`Linhagens de ${titulo}`}>
          {linhagens.map((l) => (
            <li key={l.idLinhagem} className="visao__painel">
              <CartaoDaLinhagem linhagem={l} />
            </li>
          ))}
        </ul>

        <div className="visao__resumos">
          <section className="visao__painel" aria-label={`Situação dos vivos de ${titulo}`}>
            <h4 className="visao__tituloDoGrafico">Situação dos vivos</h4>
            <RoscaDeSituacao
              total={reservados + livres}
              fatias={[
                { nome: 'Reservados', valor: reservados, cor: COR.reservados },
                { nome: 'Livres', valor: livres, cor: COR.livres },
              ]}
            />
          </section>
          <section className="visao__painel" aria-label={`Vivos por linhagem de ${titulo}`}>
            <h4 className="visao__tituloDoGrafico">Vivos por linhagem</h4>
            <BarrasDeVivos
              linhagens={linhagens.map((l) => ({
                linhagem: l.linhagem,
                reservados: quantos(l.reservados),
                livres: quantos(l.livres),
                total: quantos(l.reservados) + quantos(l.livres),
              }))}
            />
          </section>
        </div>
      </div>
    </Secao>
  )
}

/** Um número do topo: o rótulo pequeno em maiúsculas, o total grande e, se houver, ♂ e ♀ embaixo */
function CartaoDeNumero({
  rotulo,
  numero,
  sexos,
  cor,
}: {
  rotulo: string
  numero: number
  sexos?: PorSexo
  cor?: string
}) {
  return (
    <div className="visao__cartao" style={cor ? { borderTopColor: cor } : undefined}>
      <dt>
        <Texto tom="rotulo">{rotulo}</Texto>
      </dt>
      <dd>
        <span className="visao__numero">{numero}</span>
        {sexos && (
          <span className="visao__sexos">
            <span>
              {SIMBOLO_DO_SEXO.M} {sexos.m}
            </span>
            <span>
              {SIMBOLO_DO_SEXO.F} {sexos.f}
            </span>
          </span>
        )}
      </dd>
    </div>
  )
}

/** A linhagem: o nome (link para as estantes), os livres de cada sexo e o gráfico por idade */
function CartaoDaLinhagem({ linhagem: l }: { linhagem: LinhagemNaVisaoGeral }) {
  const idades = l.livresPorIdadeDias ?? []

  return (
    <>
      <header className="visao__topo">
        <Link
          className="visao__linhagem"
          to={`/estantes?linhagem=${l.idLinhagem}`}
          title={`Ver nas estantes onde estão as caixas da ${l.linhagem}`}
        >
          {l.linhagem}
        </Link>
        <span className="visao__livres">
          Livres {SIMBOLO_DO_SEXO.M} {l.livres.m} {SIMBOLO_DO_SEXO.F} {l.livres.f}
        </span>
      </header>
      {idades.length === 0 ? (
        <p className="visao__vazio">Sem animais livres.</p>
      ) : (
        <>
          <BarrasPorIdade idades={idades} linhagem={l.linhagem} />
          <LegendaDeCores itens={LEGENDA_SEXOS} />
        </>
      )}
    </>
  )
}
