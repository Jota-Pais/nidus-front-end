import { Input, Select, Table } from 'antd'
import { useState } from 'react'
import { CabecalhoDaTela, Linha, Pilha, Secao } from '@/componentes'
import { useHistorico } from '@/dominio/consultas'
import type { RegistroDoHistorico } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'

const ENTIDADES = [
  { value: 'caixa', label: 'Caixa' },
  { value: 'casal', label: 'Casal' },
  { value: 'parto', label: 'Parto' },
  { value: 'solicitacao', label: 'Solicitação' },
  { value: 'estante', label: 'Estante' },
  { value: 'usuario', label: 'Conta' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'linhagem', label: 'Linhagem' },
]

const ROTULO_ENTIDADE = Object.fromEntries(ENTIDADES.map((e) => [e.value, e.label]))

function dataEHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Quem fez cada operação, quando e o que mudou. Só leitura: nada aqui se apaga */
export function Historico() {
  const historico = useHistorico()
  const [entidade, setEntidade] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const termo = busca.trim().toLowerCase()
  const linhas = (historico.data ?? []).filter(
    (registro) =>
      (entidade === null || registro.entidade === entidade) &&
      (termo === '' ||
        registro.descricao.toLowerCase().includes(termo) ||
        registro.usuario.toLowerCase().includes(termo)),
  )

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Gestão"
        titulo="Histórico"
        descricao="As últimas 300 alterações do sistema: quem fez, quando e o quê."
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
            <Input.Search
              allowClear
              placeholder="Buscar por pessoa ou texto"
              style={{ width: 260 }}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </Linha>
        }
      >
        <EstadoDaConsulta consulta={historico} rotulo="Carregando o histórico…">
          <Table<RegistroDoHistorico>
            rowKey="id"
            dataSource={linhas}
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
