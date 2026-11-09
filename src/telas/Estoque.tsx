import { Segmented, Table } from 'antd'
import { useState } from 'react'
import { CabecalhoDaTela, Pilha, Secao } from '@/componentes'
import { useEstoque } from '@/dominio/consultas'
import type { CodigoEspecie, EstoqueDaLinhagem } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'

const ESPECIES: { value: CodigoEspecie; label: string }[] = [
  { value: 'rato', label: 'Rato' },
  { value: 'camundongo', label: 'Camundongo' },
]

const sexos = ({ m, f }: { m: number; f: number }) => `${m} M · ${f} F`

/** O que a colônia tem livre hoje, por linhagem: os vivos que ninguém reservou */
export function Estoque() {
  const [especie, setEspecie] = useState<CodigoEspecie>('rato')
  const estoque = useEstoque(especie)

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Colônia"
        titulo="Estoque"
        descricao="Os animais vivos e livres de cada linhagem, contados um a um: quem está reservado para um pedido ou saiu por baixa já não conta. Os desmamados já podem ser entregues; os que mamam ainda ficam com a mãe. Parto que ainda não aconteceu não conta."
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
              { title: 'Mamando', render: (_, l) => sexos(l.previsto) },
              { title: 'Total livre', render: (_, l) => <strong>{sexos(l.total)}</strong> },
            ]}
          />
        </EstadoDaConsulta>
      </Secao>
    </Pilha>
  )
}
