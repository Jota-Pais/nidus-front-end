import { Input, InputNumber, Select, Table } from 'antd'
import { useState } from 'react'
import { CabecalhoDaTela, Linha, Pilha, Secao } from '@/componentes'
import { useHistorico } from '@/dominio/consultas'
import type { RegistroDoHistorico } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'

const ENTIDADES = [
  { value: 'caixa', label: 'Caixa' },
  { value: 'casal', label: 'Casal' },
  { value: 'parto', label: 'Parto' },
  { value: 'pedido', label: 'Pedido' },
  { value: 'sala', label: 'Sala' },
  { value: 'estante', label: 'Estante' },
  { value: 'usuario', label: 'Conta' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'linhagem', label: 'Linhagem' },
]

const ROTULO_ENTIDADE = Object.fromEntries(ENTIDADES.map((e) => [e.value, e.label]))

function dataEHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Quem fez cada operação, quando e o que mudou: o histórico das operações junto com a trilha dos
 * animais, do registro mais novo para o mais velho. Só leitura: nada aqui se apaga
 */
export function Historico() {
  const [entidade, setEntidade] = useState<string | null>(null)
  const [idEntidade, setIdEntidade] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const historico = useHistorico({ entidade, idEntidade, busca })

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Configurações"
        titulo="Histórico"
        descricao="Quem fez cada alteração e cada fato dos animais (nascimento, baixa, mudança, reserva, entrega), quando e o quê. Mostra os 300 registros mais recentes do filtro escolhido."
      />

      <Secao
        semPreenchimento
        titulo={
          <Linha espaco={8}>
            <Select
              allowClear
              placeholder="Tudo"
              style={{ width: 160 }}
              options={ENTIDADES}
              value={entidade}
              onChange={(valor) => setEntidade(valor ?? null)}
            />
            <InputNumber<number>
              min={1}
              precision={0}
              placeholder="Nº"
              style={{ width: 90 }}
              value={idEntidade}
              onChange={(valor) => setIdEntidade(valor ?? null)}
            />
            <Input.Search
              allowClear
              placeholder="Buscar por pessoa ou texto"
              style={{ width: 260 }}
              onSearch={(valor) => setBusca(valor)}
            />
          </Linha>
        }
      >
        <EstadoDaConsulta consulta={historico} rotulo="Carregando o histórico…">
          <Table<RegistroDoHistorico>
            // o número só não se repete dentro da fonte: o histórico e a trilha contam cada um o seu
            rowKey={(r) => `${r.fonte}-${r.id}`}
            dataSource={historico.data ?? []}
            pagination={{ pageSize: 50, showSizeChanger: false }}
            scroll={{ x: true }}
            locale={{ emptyText: 'Nenhuma alteração registrada.' }}
            columns={[
              { title: 'Quando', width: 140, render: (_, r) => dataEHora(r.dataHora) },
              { title: 'Quem', dataIndex: 'usuario', width: 160 },
              {
                title: 'Onde',
                width: 130,
                render: (_, r) => `${ROTULO_ENTIDADE[r.entidade] ?? r.entidade} #${r.idEntidade}`,
              },
              { title: 'O quê', dataIndex: 'descricao' },
            ]}
          />
        </EstadoDaConsulta>
      </Secao>
    </Pilha>
  )
}
