import { Input, InputNumber, Select, Table } from 'antd'
import { useState } from 'react'
import './Historico.css'
import { Botao, CabecalhoDaTela, Linha, ListaDeCartoes, Pilha, Secao, Texto } from '@/componentes'
import { useHistorico } from '@/dominio/consultas'
import type { RegistroDoHistorico } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { FichaDaCaixa } from './FichaDaCaixa'

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

/** No celular a lista cresce de tanto em tanto, como as páginas da tabela */
const POR_VEZ = 50

/** O que a API diz em `onde` ("Caixa F1A", "Pedido #3"); sem ele, a entidade da linha e o número dela */
const ondeFoi = (r: RegistroDoHistorico) =>
  r.onde ?? `${ROTULO_ENTIDADE[r.entidade] ?? r.entidade} #${r.idEntidade}`

/**
 * Quem fez cada operação, quando e o que mudou: o histórico das operações junto com a trilha dos
 * animais, do registro mais novo para o mais velho. Só leitura: nada aqui se apaga. A linha de uma
 * caixa abre a ficha dela, também a da caixa liberada, que já saiu das estantes: é por
 * ali que se anula a baixa que a esvaziou
 */
export function Historico() {
  const [entidade, setEntidade] = useState<string | null>(null)
  const [idEntidade, setIdEntidade] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const historico = useHistorico({ entidade, idEntidade, busca })
  const [idFicha, setIdFicha] = useState<number | null>(null)
  const estreita = useTelaEstreita()
  const [quantos, setQuantos] = useState(POR_VEZ)
  const registros = historico.data ?? []

  /** A caixa abre a ficha; o resto só diz onde foi */
  const onde = (r: RegistroDoHistorico) =>
    r.entidade === 'caixa' ? (
      <Botao
        variante="fantasma"
        size={estreita ? 'middle' : 'small'}
        className="historico__onde"
        {...(estreita ? {} : { title: 'Abrir a ficha da caixa' })}
        onClick={() => setIdFicha(r.idEntidade)}
      >
        {ondeFoi(r)}
      </Botao>
    ) : (
      ondeFoi(r)
    )

  const filtros = (
    <div className={estreita ? 'historico__filtros historico__filtros--estreito' : undefined}>
      <Linha espaco={8}>
        <Select
          allowClear
          aria-label="Onde"
          placeholder="Tudo"
          {...(estreita ? {} : { style: { width: 160 } })}
          className="historico__entidade"
          options={ENTIDADES}
          value={entidade}
          onChange={(valor) => setEntidade(valor ?? null)}
        />
        <InputNumber<number>
          min={1}
          precision={0}
          aria-label="Número"
          placeholder="Nº"
          inputMode="numeric"
          style={{ width: 90 }}
          value={idEntidade}
          onChange={(valor) => setIdEntidade(valor ?? null)}
        />
        <Input.Search
          allowClear
          aria-label="Buscar"
          placeholder="Buscar por pessoa ou texto"
          {...(estreita ? {} : { style: { width: 260 } })}
          className="historico__busca"
          onSearch={(valor) => setBusca(valor)}
        />
      </Linha>
    </div>
  )

  return (
    <Pilha>
      <CabecalhoDaTela
        rotulo="Configurações"
        titulo="Histórico"
        descricao="Quem fez cada registro dos animais e das operações (nascimento, baixa, mudança, reserva, entrega), quando e o quê. Mostra os 300 registros mais recentes do filtro escolhido."
      />

      <Secao semPreenchimento titulo={filtros}>
        <EstadoDaConsulta consulta={historico} rotulo="Carregando o histórico…">
          {estreita ? (
            // no celular, um registro por cartão: quando, quem e onde em cima, o texto inteiro
            // embaixo. A tabela espremia o texto, que é o que se lê
            <>
              <ListaDeCartoes
                itens={registros.slice(0, quantos)}
                chave={(r) => `${r.fonte}-${r.id}`}
                rotulo="Registros do histórico"
                vazio="Nenhum registro."
                renderizar={(r) => (
                  <>
                    <ListaDeCartoes.Topo lado={onde(r)}>
                      <Texto tom="secundario">
                        {dataEHora(r.dataHora)} · {r.usuario}
                      </Texto>
                    </ListaDeCartoes.Topo>
                    <Texto>{r.descricao}</Texto>
                  </>
                )}
              />
              {registros.length > quantos && (
                <div className="historico__mais">
                  <Botao onClick={() => setQuantos((n) => n + POR_VEZ)}>
                    Mostrar mais ({registros.length - quantos})
                  </Botao>
                </div>
              )}
            </>
          ) : (
            <Table<RegistroDoHistorico>
              // o número só não se repete dentro da fonte: o histórico e a trilha contam cada um o seu
              rowKey={(r) => `${r.fonte}-${r.id}`}
              dataSource={registros}
              pagination={{ pageSize: 50, showSizeChanger: false }}
              scroll={{ x: true }}
              locale={{ emptyText: 'Nenhum registro.' }}
              columns={[
                { title: 'Quando', width: 140, render: (_, r) => dataEHora(r.dataHora) },
                { title: 'Quem', dataIndex: 'usuario', width: 160 },
                {
                  title: 'Onde',
                  width: 130,
                  render: (_, r) => onde(r),
                },
                { title: 'O quê', dataIndex: 'descricao' },
              ]}
            />
          )}
        </EstadoDaConsulta>
      </Secao>

      <FichaDaCaixa idCaixa={idFicha} aoFechar={() => setIdFicha(null)} />
    </Pilha>
  )
}
