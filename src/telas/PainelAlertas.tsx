import type { TableProps } from 'antd'
import {
  Aviso,
  CabecalhoDaTela,
  EstadoDaConsulta,
  IndicadorDeCiclo,
  Pilha,
  ProximoEvento,
  Secao,
  Tabela,
  Texto,
  Vazio,
} from '@/componentes'
import type { ItemComData, ItemDoAlerta } from '@/dominio/alertas'
import type { TipoDeEvento } from '@/dominio/estante'
import { useAlertas } from '@/dominio/useAlertas'

/**
 * Posição + linhagem: as duas primeiras colunas se repetem nas quatro
 * tabelas. Não é o `Endereco` da grade — este não sabe a face da caixa (o
 * contrato de alertas não traz esse campo, só o que basta pra achar a caixa
 * pelo código e pela estante).
 */
function colunaDaPosicao<T extends ItemDoAlerta>(): NonNullable<TableProps<T>['columns']>[number] {
  return {
    title: 'Posição',
    key: 'posicao',
    render: (_, item) => (
      <span title={`${item.numeroVisivel} · ${item.sala} · posição ${item.codigo}`}>
        <Texto tom="forte">{item.numeroVisivel}</Texto> · {item.sala} ·{' '}
        <Texto tom="forte">{item.codigo}</Texto>
      </span>
    ),
  }
}

function colunaDoCasal<T extends ItemDoAlerta>(): NonNullable<TableProps<T>['columns']>[number] {
  return {
    title: 'Casal',
    key: 'casal',
    render: (_, item) => (
      <Pilha espaco={2}>
        <span>{item.casal.identificacao}</span>
        <IndicadorDeCiclo atual={item.casal.cicloAtual} maximo={item.casal.maxCiclos} compacto />
      </Pilha>
    ),
  }
}

/** As três primeiras tabelas do painel: mesma forma, o `tipo` é fixo por tabela. */
function TabelaComData({ itens, tipo }: { itens: ItemComData[]; tipo: TipoDeEvento }) {
  if (itens.length === 0) {
    return <Vazio descricao="Nada aqui no momento." />
  }

  const colunas: TableProps<ItemComData>['columns'] = [
    colunaDaPosicao<ItemComData>(),
    { title: 'Linhagem', dataIndex: 'linhagem' },
    colunaDoCasal<ItemComData>(),
    {
      title: 'Quando',
      key: 'quando',
      render: (_, item) => (
        <ProximoEvento evento={{ tipo, data: item.data, atrasado: item.atrasado }} semRotulo />
      ),
    },
  ]

  return <Tabela<ItemComData> rowKey="idCaixa" columns={colunas} dataSource={itens} pagination={false} />
}

/**
 * `RF-REP-07` — painel do técnico com o que vence hoje e nos próximos dias.
 *
 * Não filtra por espécie: ao contrário do quadro (`RF-CIC-01`), o começo do
 * dia do técnico é uma lista só, não duas — a segregação por espécie faz
 * sentido pra o Kanban da colônia, não pra "o que eu preciso fazer hoje".
 *
 * A previsão vencida sem confirmação (`atrasado: true`) já vem destacada em
 * vermelho dentro de cada tabela (`ProximoEvento`), mas o requisito pede que
 * ela "grite" — por isso também sobe pro aviso no topo, em vez de esperar o
 * técnico rolar até achar a linha vermelha no meio da lista.
 */
export function PainelAlertas() {
  const alertas = useAlertas()

  const atrasados = [
    ...(alertas.data?.partosPrevistos ?? []),
    ...(alertas.data?.desmamesPrevistos ?? []),
  ].filter((item) => item.atrasado)

  return (
    <Pilha>
      <CabecalhoDaTela
        titulo="Alertas do ciclo"
        rotulo="Técnico"
        descricao="O que vence hoje e nos próximos dias: partos, desmames, reacasalamentos liberados e casais perto do limite de ciclos."
      />

      <EstadoDaConsulta consulta={alertas} rotulo="Carregando os alertas…">
        <Pilha espaco={20}>
          {atrasados.length > 0 && (
            <Aviso
              tom="erro"
              titulo={
                atrasados.length === 1
                  ? '1 previsão vencida sem confirmação'
                  : `${atrasados.length} previsões vencidas sem confirmação`
              }
            >
              Previsão vencida sem confirmação é o principal ponto de erosão silenciosa da
              confiabilidade dos dados — confirme o parto ou o desmame assim que possível.
            </Aviso>
          )}

          <Secao titulo="Partos previstos">
            <TabelaComData itens={alertas.data?.partosPrevistos ?? []} tipo="parto_previsto" />
          </Secao>

          <Secao titulo="Desmames previstos">
            <TabelaComData itens={alertas.data?.desmamesPrevistos ?? []} tipo="desmame_previsto" />
          </Secao>

          <Secao titulo="Reacasalamentos liberados">
            <TabelaComData
              itens={alertas.data?.reacasalamentosLiberados ?? []}
              tipo="reacasalamento_liberado"
            />
          </Secao>

          <Secao titulo="Casais no último ciclo">
            {alertas.data?.casaisNoUltimoCiclo.length === 0 || !alertas.data ? (
              <Vazio descricao="Nenhum casal ativo no último ciclo permitido." />
            ) : (
              <Tabela<ItemDoAlerta>
                rowKey="idCaixa"
                pagination={false}
                columns={[
                  colunaDaPosicao<ItemDoAlerta>(),
                  { title: 'Linhagem', dataIndex: 'linhagem' },
                  colunaDoCasal<ItemDoAlerta>(),
                ]}
                dataSource={alertas.data.casaisNoUltimoCiclo}
              />
            )}
          </Secao>
        </Pilha>
      </EstadoDaConsulta>
    </Pilha>
  )
}
