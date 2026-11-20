import { Input, Select, Table, Tabs } from 'antd'
import { useState } from 'react'
import { Botao, Etiqueta, Janela, Linha, ListaDeCartoes, Texto, Vazio } from '@/componentes'
import { useCaixasLiberadas, useCatalogo } from '@/dominio/consultas'
import {
  casaisAntes,
  descreverPartos,
  descreverQuandoSaiu,
  descreverTipo,
  periodoDoCasal,
} from '@/dominio/liberada'
import type { CaixaLiberada, Catalogo } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { FichaDaCaixa } from './FichaDaCaixa'
import './FichaDoHistorico.css'

type Especie = Catalogo['especies'][number]

/** Quantas caixas a lista mostra de cada vez; "Mostrar mais" pede outras tantas à API */
const POR_VEZ = 50

/**
 * O histórico das estantes: as caixas que esvaziaram e foram liberadas, e com elas os casais
 * encerrados que moravam nelas. Saíram da grade, mas a ficha continua: clicar numa abre a ficha
 * dela, a mesma da grade, com os casais, os partos e os animais. Uma aba por espécie do catálogo
 */
export function FichaDoHistorico({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  const [idFicha, setIdFicha] = useState<number | null>(null)

  return (
    <>
      <Janela
        open={aberta}
        onCancel={aoFechar}
        footer={null}
        width={900}
        destroyOnHidden
        styles={{
          header: { background: 'var(--cor-suave)', margin: '-20px -24px 0', padding: '16px 24px' },
        }}
        title="Histórico das estantes"
      >
        <p className="fichaDoHistorico__explicacao">
          As caixas que esvaziaram e saíram da estante, da mais recente para a mais antiga. A ficha
          de cada uma continua guardada, com o casal, os partos e os animais.
        </p>
        <AbasDasEspecies aoAbrir={setIdFicha} />
      </Janela>

      <FichaDaCaixa idCaixa={idFicha} aoFechar={() => setIdFicha(null)} />
    </>
  )
}

/** Uma aba por espécie do catálogo. Fica dentro da janela: fechada, ela não busca nada */
function AbasDasEspecies({ aoAbrir }: { aoAbrir: (idCaixa: number) => void }) {
  const catalogo = useCatalogo()
  const especies = catalogo.data?.especies ?? []

  return (
    <EstadoDaConsulta consulta={catalogo} rotulo="Carregando as espécies…">
      {especies.length === 0 ? (
        <Vazio descricao="Nenhuma espécie cadastrada." />
      ) : (
        <Tabs
          items={especies.map((especie) => ({
            key: String(especie.id),
            label: especie.nome,
            children: <LiberadasDaEspecie especie={especie} aoAbrir={aoAbrir} />,
          }))}
        />
      )}
    </EstadoDaConsulta>
  )
}

/** A lista de uma espécie, com os filtros dela: cada aba tem os seus */
function LiberadasDaEspecie({
  especie,
  aoAbrir,
}: {
  especie: Especie
  aoAbrir: (idCaixa: number) => void
}) {
  const [idLinhagem, setIdLinhagem] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(POR_VEZ)
  const liberadas = useCaixasLiberadas({ idEspecie: especie.id, idLinhagem, busca, limite })
  const estreita = useTelaEstreita()
  const caixas = liberadas.data?.caixas ?? []
  const filtrado = idLinhagem !== null || busca.trim() !== ''

  const vazio = filtrado
    ? 'Nenhuma caixa liberada com esse filtro.'
    : `Nenhuma caixa de ${especie.nome.toLowerCase()} saiu da estante ainda. Quando uma caixa esvazia, ela aparece aqui.`

  return (
    <div className="fichaDoHistorico__aba">
      <div
        className={
          estreita
            ? 'fichaDoHistorico__filtros fichaDoHistorico__filtros--estreito'
            : 'fichaDoHistorico__filtros'
        }
      >
        <Select<number>
          allowClear
          aria-label="Linhagem"
          placeholder="Todas as linhagens"
          className="fichaDoHistorico__linhagem"
          options={especie.linhagens.map((linhagem) => ({
            value: linhagem.id,
            label: linhagem.nome,
          }))}
          value={idLinhagem}
          onChange={(valor) => {
            setIdLinhagem(valor ?? null)
            setLimite(POR_VEZ)
          }}
        />
        <Input.Search
          allowClear
          aria-label="Buscar"
          placeholder="Caixa, estante ou casal"
          className="fichaDoHistorico__busca"
          onSearch={(valor) => {
            setBusca(valor)
            setLimite(POR_VEZ)
          }}
        />
      </div>

      <EstadoDaConsulta consulta={liberadas} rotulo="Carregando as caixas liberadas…">
        {estreita ? (
          <ListaDeCartoes
            itens={caixas}
            chave={(caixa) => caixa.id}
            rotulo={`Caixas liberadas de ${especie.nome.toLowerCase()}`}
            vazio={vazio}
            renderizar={(caixa) => <CartaoDaLiberada caixa={caixa} aoAbrir={aoAbrir} />}
          />
        ) : (
          <Table<CaixaLiberada>
            rowKey="id"
            size="small"
            dataSource={caixas}
            pagination={false}
            scroll={{ x: true }}
            locale={{ emptyText: <Vazio descricao={vazio} /> }}
            onRow={(caixa) => ({
              className: 'fichaDoHistorico__linha',
              onClick: () => aoAbrir(caixa.id),
            })}
            columns={[
              {
                title: 'Caixa',
                width: 150,
                render: (_, caixa) => (
                  <div className="fichaDoHistorico__caixa">
                    <Botao
                      variante="fantasma"
                      size="small"
                      title="Abrir a ficha da caixa"
                      onClick={(evento) => {
                        // a linha também abre: um clique só
                        evento.stopPropagation()
                        aoAbrir(caixa.id)
                      }}
                    >
                      {caixa.codigo}
                    </Botao>
                    <Texto tom="secundario">
                      {caixa.sala} · {caixa.numeroVisivel}
                    </Texto>
                  </div>
                ),
              },
              { title: 'Tipo', width: 150, render: (_, caixa) => descreverTipo(caixa) },
              { title: 'Linhagem', width: 120, render: (_, caixa) => caixa.linhagem ?? '—' },
              {
                title: 'Casal',
                render: (_, caixa) => <CasalDaLiberada caixa={caixa} />,
              },
              {
                title: 'Saiu da estante',
                width: 170,
                render: (_, caixa) => descreverQuandoSaiu(caixa),
              },
            ]}
          />
        )}
        {liberadas.data?.temMais && (
          <div className="fichaDoHistorico__mais">
            <Botao loading={liberadas.isFetching} onClick={() => setLimite((n) => n + POR_VEZ)}>
              Mostrar mais
            </Botao>
          </div>
        )}
      </EstadoDaConsulta>
    </div>
  )
}

/** O casal mais recente da caixa: a identificação, quando morou nela e o que deu */
function CasalDaLiberada({ caixa }: { caixa: CaixaLiberada }) {
  const [casal] = caixa.casais
  if (casal === undefined) return <>—</>

  const outros = casaisAntes(caixa)

  return (
    <div className="fichaDoHistorico__casal">
      <span>
        <strong>{casal.identificacao}</strong> · {periodoDoCasal(casal)}
      </span>
      <Texto tom="secundario">
        {descreverPartos(casal)}
        {outros && ` · ${outros}`}
      </Texto>
    </div>
  )
}

/** O cartão do celular: o endereço e o tipo em cima, os dados embaixo, e o botão da ficha */
function CartaoDaLiberada({
  caixa,
  aoAbrir,
}: {
  caixa: CaixaLiberada
  aoAbrir: (idCaixa: number) => void
}) {
  return (
    <>
      <ListaDeCartoes.Topo lado={<Etiqueta>{descreverTipo(caixa)}</Etiqueta>}>
        <Linha espaco={6}>
          <strong>{caixa.codigo}</strong>
          <Texto tom="secundario">
            {caixa.sala} · {caixa.numeroVisivel}
          </Texto>
        </Linha>
      </ListaDeCartoes.Topo>
      <ListaDeCartoes.Dados>
        <ListaDeCartoes.Dado rotulo="Linhagem">{caixa.linhagem ?? '—'}</ListaDeCartoes.Dado>
        <ListaDeCartoes.Dado rotulo="Saiu da estante">
          {descreverQuandoSaiu(caixa)}
        </ListaDeCartoes.Dado>
        {caixa.casais.length > 0 && (
          <ListaDeCartoes.Dado rotulo="Casal" largo>
            <CasalDaLiberada caixa={caixa} />
          </ListaDeCartoes.Dado>
        )}
      </ListaDeCartoes.Dados>
      <ListaDeCartoes.Acoes>
        <Botao onClick={() => aoAbrir(caixa.id)}>Abrir a ficha</Botao>
      </ListaDeCartoes.Acoes>
    </>
  )
}
