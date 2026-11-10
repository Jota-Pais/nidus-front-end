import { Table } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CabecalhoDaTela, ListaDeCartoes, Pilha, Secao, Texto, Vazio } from '@/componentes'
import { SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useVisaoGeral } from '@/dominio/consultas'
import type {
  CodigoEspecie,
  EspecieNaVisaoGeral,
  FaixaDeIdade,
  LinhagemNaVisaoGeral,
  PorSexo,
} from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import './VisaoGeral.css'

/** A colônia de relance: quantos animais cada espécie e linhagem tem, reservados e livres */
export function VisaoGeral() {
  const visao = useVisaoGeral()

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Colônia"
        titulo="Visão geral"
        descricao="Quantos animais vivos cada linhagem tem, quantos estão reservados e quantos estão livres."
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

/** Os números da espécie: a soma das linhagens */
function totalDaEspecie(linhagens: LinhagemNaVisaoGeral[]) {
  return linhagens.reduce(
    (total, l) => ({
      casais: total.casais + l.casais,
      vivos: somar(total.vivos, l.vivos),
      mamando: somar(total.mamando, l.mamando),
      reservados: somar(total.reservados, l.reservados),
      livres: somar(total.livres, l.livres),
    }),
    { casais: 0, vivos: NADA, mamando: NADA, reservados: NADA, livres: NADA },
  )
}

/** "até 21 d", "22–35 d", "mais de 60 d": o rótulo da faixa, das pontas que a API manda */
function rotuloDaFaixa({ de, ate }: Pick<FaixaDeIdade, 'de' | 'ate'>, curto = false): string {
  // no cartão do celular a coluna é estreita: "> 60 d" cabe onde "mais de 60 d" não cabe
  if (ate === null) return curto ? `> ${de - 1} d` : `mais de ${de - 1} d`
  if (de === 0) return `até ${ate} d`
  return `${de}–${ate} d`
}

function Especie({ especie }: { especie: EspecieNaVisaoGeral }) {
  const estreita = useTelaEstreita()
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
  const mamando = total.mamando.m + total.mamando.f
  // as faixas são sempre as mesmas: as colunas saem da primeira linhagem
  const faixas = linhagens[0]!.livresPorIdade

  return (
    <Secao titulo={titulo}>
      <dl className="visao__placar" aria-label={`Totais de ${titulo}`}>
        <Dado rotulo="Vivos" nota={`${mamando} mamando`}>
          <Sexos {...total.vivos} />
        </Dado>
        <Dado rotulo="Reservados">
          <Sexos {...total.reservados} />
        </Dado>
        <Dado rotulo="Livres">
          <Sexos {...total.livres} />
        </Dado>
        <Dado rotulo="Casais">
          <span className="visao__numero">{total.casais}</span>{' '}
          {total.casais === 1 ? 'ativo' : 'ativos'}
        </Dado>
      </dl>

      {estreita ? (
        // no celular, um cartão por linhagem no lugar das duas tabelas, que rolariam de lado
        <ListaDeCartoes
          itens={linhagens}
          chave={(l) => l.idLinhagem}
          rotulo={`Linhagens de ${titulo}`}
          vazio="Nenhuma linhagem nesta espécie."
          renderizar={(l) => <CartaoDaLinhagem linhagem={l} />}
        />
      ) : (
        <>
          <Table<LinhagemNaVisaoGeral>
            className="visao__tabela"
            aria-label={`Linhagens de ${titulo}`}
            rowKey="idLinhagem"
            dataSource={linhagens}
            pagination={false}
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Linhagem',
                render: (_, l) => <NomeDaLinhagem linhagem={l} />,
              },
              { title: 'Casais', render: (_, l) => (l.casais === 0 ? '–' : l.casais) },
              { title: 'Vivos', render: (_, l) => <Pouco {...l.vivos} /> },
              { title: 'Mamando', render: (_, l) => <Pouco {...l.mamando} /> },
              { title: 'Reservados', render: (_, l) => <Pouco {...l.reservados} /> },
              { title: 'Livres', render: (_, l) => <Pouco {...l.livres} forte /> },
            ]}
          />

          <h4 className="visao__subtitulo">Livres por idade</h4>
          <Table<LinhagemNaVisaoGeral>
            className="visao__tabela"
            aria-label={`Livres por idade de ${titulo}`}
            rowKey="idLinhagem"
            dataSource={linhagens}
            pagination={false}
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Linhagem',
                render: (_, l) => <NomeDaLinhagem linhagem={l} />,
              },
              ...faixas.map((faixa, indice) => ({
                title: rotuloDaFaixa(faixa),
                key: rotuloDaFaixa(faixa),
                render: (_: unknown, l: LinhagemNaVisaoGeral) => {
                  const daFaixa = l.livresPorIdade[indice] ?? NADA
                  return <Pouco m={daFaixa.m} f={daFaixa.f} />
                },
              })),
            ]}
          />
        </>
      )}
    </Secao>
  )
}

/**
 * A linhagem no celular: o nome leva às estantes; embaixo, os números em duas colunas, com os
 * livres em destaque, e os livres de cada faixa de idade numa linha de quatro
 */
function CartaoDaLinhagem({ linhagem: l }: { linhagem: LinhagemNaVisaoGeral }) {
  return (
    <>
      <ListaDeCartoes.Topo
        lado={
          <Texto tom="secundario">
            {l.casais === 0 ? 'sem casal' : `${l.casais} ${l.casais === 1 ? 'casal' : 'casais'}`}
          </Texto>
        }
      >
        <NomeDaLinhagem linhagem={l} />
      </ListaDeCartoes.Topo>
      <ListaDeCartoes.Dados>
        <ListaDeCartoes.Dado rotulo="Vivos">
          <Pouco {...l.vivos} />
        </ListaDeCartoes.Dado>
        <ListaDeCartoes.Dado rotulo="Mamando">
          <Pouco {...l.mamando} />
        </ListaDeCartoes.Dado>
        <ListaDeCartoes.Dado rotulo="Reservados">
          <Pouco {...l.reservados} />
        </ListaDeCartoes.Dado>
        <ListaDeCartoes.Dado rotulo="Livres">
          <Pouco {...l.livres} forte />
        </ListaDeCartoes.Dado>
      </ListaDeCartoes.Dados>
      <div className="visao__faixas">
        <Texto tom="rotulo">Livres por idade</Texto>
        <dl className="visao__faixasDados">
          {l.livresPorIdade.map((faixa) => (
            <div key={rotuloDaFaixa(faixa)} className="visao__faixa">
              <dt>{rotuloDaFaixa(faixa, true)}</dt>
              <dd>
                <Pouco m={faixa.m} f={faixa.f} empilhado />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

/** Um bloco do placar: o rótulo em cima, os números grandes e, se houver, uma nota embaixo */
function Dado({ rotulo, nota, children }: { rotulo: string; nota?: string; children: ReactNode }) {
  return (
    <div className="visao__dado">
      <dt>
        <Texto tom="rotulo">{rotulo}</Texto>
      </dt>
      <dd>
        <span className="visao__valor">{children}</span>
        {nota && (
          <Texto tom="secundario" className="visao__nota">
            {nota}
          </Texto>
        )}
      </dd>
    </div>
  )
}

/** "♂ 21  ♀ 21" com os números grandes, para o placar */
function Sexos({ m, f }: PorSexo) {
  return (
    <>
      <span className="visao__sexo">
        <span className="visao__simbolo">{SIMBOLO_DO_SEXO.M}</span>
        <span className="visao__numero">{m}</span>
      </span>
      <span className="visao__sexo">
        <span className="visao__simbolo">{SIMBOLO_DO_SEXO.F}</span>
        <span className="visao__numero">{f}</span>
      </span>
    </>
  )
}

/**
 * "♂ 3  ♀ 2" na tabela, ou "–" quando não há nenhum dos dois. Empilhado, um sexo embaixo do
 * outro, para caber na faixa de idade do cartão do celular
 */
function Pouco({
  m,
  f,
  forte = false,
  empilhado = false,
}: PorSexo & { forte?: boolean; empilhado?: boolean }) {
  if (m + f === 0) return <span className="visao__nenhum">–</span>

  const classes = [
    'visao__celula',
    forte ? 'visao__celula--forte' : '',
    empilhado ? 'visao__celula--empilhada' : '',
  ].filter(Boolean)

  return (
    <span className={classes.join(' ')}>
      <span>
        {SIMBOLO_DO_SEXO.M} {m}
      </span>
      <span>
        {SIMBOLO_DO_SEXO.F} {f}
      </span>
    </span>
  )
}

/** O nome leva à grade das estantes com só esta linhagem acesa */
function NomeDaLinhagem({ linhagem }: { linhagem: LinhagemNaVisaoGeral }) {
  return (
    <Link
      className="visao__linhagem"
      to={`/estantes?linhagem=${linhagem.idLinhagem}`}
      title={`Ver nas estantes onde estão as caixas da ${linhagem.linhagem}`}
    >
      {linhagem.linhagem}
    </Link>
  )
}
