import { Segmented, Table } from 'antd'
import { useState } from 'react'
import { CabecalhoDaTela, Pilha, Secao } from '@/componentes'
import { useEstoque } from '@/dominio/consultas'
import type { CodigoEspecie, EstoqueDaLinhagem } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { formatarData } from '@/lib/data'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Rato' },
  { value: 'camundongo', label: 'Camundongo' },
]

const sexos = ({ m, f }: { m: number; f: number }) => `${m} M · ${f} F`

/** O que a colônia tem livre hoje e o que vem dos partos previstos, por linhagem */
export function Estoque() {
  const [especie, setEspecie] = useState<CodigoEspecie>('rato')
  const estoque = useEstoque(especie)

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Colônia"
        titulo="Estoque"
        descricao="Animais livres por linhagem, já sem o que está comprometido com solicitações. Desmamados são certos, nascidos ainda podem mudar no desmame e os previstos dependem do parto."
      />

      <Secao>
        <Segmented<CodigoEspecie>
          value={especie}
          onChange={setEspecie}
          options={ESPECIES}
          size="large"
        />
      </Secao>

      <Secao titulo="Por linhagem" semPreenchimento>
        <EstadoDaConsulta consulta={estoque} rotulo="Somando o estoque…">
          <Table<EstoqueDaLinhagem>
            rowKey="idLinhagem"
            dataSource={estoque.data?.linhagens ?? []}
            pagination={false}
            scroll={{ x: true }}
            locale={{ emptyText: 'Nenhuma linhagem ativa nesta espécie.' }}
            columns={[
              { title: 'Linhagem', dataIndex: 'linhagem' },
              { title: 'Desmamados', render: (_, l) => sexos(l.confirmado) },
              { title: 'Nascidos', render: (_, l) => sexos(l.previsto) },
              { title: 'Partos previstos', render: (_, l) => sexos(l.projetado) },
              { title: 'Total livre', render: (_, l) => <strong>{sexos(l.total)}</strong> },
              { title: 'Próximo parto', render: (_, l) => formatarData(l.proximoParto) },
            ]}
          />
        </EstadoDaConsulta>
      </Secao>
    </Pilha>
  )
}
