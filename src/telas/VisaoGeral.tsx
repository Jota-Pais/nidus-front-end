import { Link } from 'react-router-dom'
import { CabecalhoDaTela, Pilha, Secao, Vazio } from '@/componentes'
import { SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useVisaoGeral } from '@/dominio/consultas'
import type {
  AleitamentoNaVisaoGeral,
  CodigoEspecie,
  EspecieNaVisaoGeral,
  LinhagemNaVisaoGeral,
  PorSexo,
} from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { COR, LEGENDA_SEXOS } from './coresDaVisao'
import { BarrasDeVivos, BarrasPorIdade, LegendaDeCores, RoscaDeSituacao } from './graficosDaVisao'
import './VisaoGeral.css'

/**
 * A colônia de relance: por linhagem, casais, em aleitamento, reservados e livres, os livres por
 * idade e, desde o início, as baixas do aleitamento sobre os nascidos
 */
export function VisaoGeral() {
  const visao = useVisaoGeral()

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Colônia"
        titulo="Visão geral"
        descricao="Por linhagem: casais ativos, animais em aleitamento, reservados e livres, os livres por idade e as baixas do aleitamento desde o início."
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

const SEM_ALEITAMENTO: AleitamentoNaVisaoGeral = {
  nascidos: 0,
  ajusteDeNinhada: 0,
  mortesNoAleitamento: 0,
}

const somarAleitamento = (
  a: AleitamentoNaVisaoGeral,
  b: AleitamentoNaVisaoGeral = SEM_ALEITAMENTO,
): AleitamentoNaVisaoGeral => ({
  nascidos: a.nascidos + b.nascidos,
  ajusteDeNinhada: a.ajusteDeNinhada + b.ajusteDeNinhada,
  mortesNoAleitamento: a.mortesNoAleitamento + b.mortesNoAleitamento,
})

/** Os números da espécie: a soma das linhagens */
function totalDaEspecie(linhagens: LinhagemNaVisaoGeral[]) {
  return linhagens.reduce(
    (total, l) => ({
      casais: total.casais + l.casais,
      mamando: somar(total.mamando, l.mamando),
      reservados: somar(total.reservados, l.reservados),
      livres: somar(total.livres, l.livres),
      aleitamento: somarAleitamento(total.aleitamento, l.aleitamento),
    }),
    {
      casais: 0,
      mamando: NADA,
      reservados: NADA,
      livres: NADA,
      aleitamento: SEM_ALEITAMENTO,
    },
  )
}

/** "3 (4% dos nascidos)"; sem nascidos, só o número. Abaixo de 1%, "menos de 1%" */
function comPorcentagem(qtd: number, nascidos: number): string {
  if (nascidos === 0) return String(qtd)

  const porcento = (qtd * 100) / nascidos
  const texto = qtd > 0 && porcento < 1 ? 'menos de 1' : String(Math.round(porcento))

  return `${qtd} (${texto}% dos nascidos)`
}

/**
 * As baixas do aleitamento desde o início, numa linha discreta: o ajuste de ninhada e as mortes no
 * aleitamento, cada um com a porcentagem sobre os nascidos de partos registrados no Nidus
 */
function LinhaDoAleitamento({ aleitamento }: { aleitamento: AleitamentoNaVisaoGeral }) {
  const { nascidos } = aleitamento

  return (
    <p className="visao__aleitamento">
      <span>Desde o início:</span>{' '}
      <span>Ajuste de ninhada {comPorcentagem(aleitamento.ajusteDeNinhada, nascidos)}</span>
      <span aria-hidden="true"> · </span>
      <span>Mortes no aleitamento {comPorcentagem(aleitamento.mortesNoAleitamento, nascidos)}</span>
      <span aria-hidden="true"> · </span>
      <span>
        {nascidos} {nascidos === 1 ? 'nascido' : 'nascidos'} em partos registrados
      </span>
    </p>
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
        <div>
          <TabelaDasLinhagens titulo={titulo} linhagens={linhagens} total={total} />
          <LinhaDoAleitamento aleitamento={total.aleitamento} />
        </div>

        <section aria-label={`Livres por idade de ${titulo}`}>
          <h4 className="visao__tituloDoGrafico">Livres por idade</h4>
          <ul className="visao__linhagens" aria-label={`Linhagens de ${titulo}`}>
            {linhagens.map((l) => (
              <li key={l.idLinhagem} className="visao__painel">
                <CartaoDaLinhagem linhagem={l} />
              </li>
            ))}
          </ul>
        </section>

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

/** As colunas da tabela, na ordem da tela, com a cor da série na bolinha do cabeçalho */
const COLUNAS = [
  { rotulo: 'Em aleitamento', cor: 'var(--fase-mamando-texto)', valor: (l: Numeros) => l.mamando },
  { rotulo: 'Reservados', cor: COR.reservados, valor: (l: Numeros) => l.reservados },
  { rotulo: 'Livres', cor: COR.livres, valor: (l: Numeros) => l.livres },
]

type Numeros = Pick<LinhagemNaVisaoGeral, 'casais' | 'mamando' | 'reservados' | 'livres'>

/**
 * Os números da espécie numa tabela: uma linha por linhagem (o nome leva às estantes) e o total
 * embaixo. Cabe muitas linhagens e compara de relance, o que o cartão não dava
 */
function TabelaDasLinhagens({
  titulo,
  linhagens,
  total,
}: {
  titulo: string
  linhagens: LinhagemNaVisaoGeral[]
  total: Numeros
}) {
  return (
    <div className="visao__rolagem">
      <table className="visao__tabela" aria-label={`Números de ${titulo} por linhagem`}>
        <thead>
          <tr>
            <th scope="col">Linhagem</th>
            <th scope="col">Casais ativos</th>
            {COLUNAS.map((c) => (
              <th key={c.rotulo} scope="col">
                <span className="visao__bolinha" style={{ background: c.cor }} aria-hidden="true" />
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhagens.map((l) => (
            <tr key={l.idLinhagem}>
              <th scope="row">
                <Link
                  className="visao__linhagem"
                  to={`/estantes?linhagem=${l.idLinhagem}`}
                  title={`Ver nas estantes onde estão as caixas da ${l.linhagem}`}
                >
                  {l.linhagem}
                </Link>
              </th>
              <CelulasDosNumeros numeros={l} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <CelulasDosNumeros numeros={total} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function CelulasDosNumeros({ numeros }: { numeros: Numeros }) {
  return (
    <>
      <td>{numeros.casais}</td>
      {COLUNAS.map((c) => (
        <td key={c.rotulo}>
          <Sexos sexos={c.valor(numeros)} />
        </td>
      ))}
    </>
  )
}

/** ♂ e ♀ lado a lado, cada um com o seu número; na coluna estreita, um embaixo do outro */
function Sexos({ sexos }: { sexos: PorSexo }) {
  return (
    <span className="visao__sexos">
      <span>
        {SIMBOLO_DO_SEXO.M} {sexos.m}
      </span>
      <span>
        {SIMBOLO_DO_SEXO.F} {sexos.f}
      </span>
    </span>
  )
}

/** A linhagem no gráfico: o nome (link para as estantes) e os livres por idade, por sexo */
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
