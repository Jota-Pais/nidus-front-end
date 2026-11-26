import { App, Form, Input, InputNumber, Segmented, Table } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, Janela, Linha, ListaDeCartoes } from '@/componentes'
import { useFormatos, useSalvarFormato } from '@/dominio/consultas'
import type { DadosDoFormato } from '@/dominio/consultas'
import {
  avisoDoUso,
  estantesDoFormato,
  MAIOR_MEDIDA,
  MAXIMO_DE_LETRAS,
  medidasQueCabem,
  MENSAGEM_DAS_LETRAS,
  usadoPor,
} from '@/dominio/formato'
import type { Formato } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { motivoDaFalha, useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { MiniaturaDaEstante } from './MiniaturaDaEstante'
import './FormatosDeEstante.css'

/** "128 caixas": quantas posições o formato tem */
const caixas = (formato: Formato) =>
  `${formato.capacidade} ${formato.capacidade === 1 ? 'caixa' : 'caixas'}`

/**
 * Os formatos de estante: o nome e as medidas que cada estante copia. Técnico e gestor cadastram,
 * editam e removem; o formato que alguma estante usa não sai da lista
 */
export function FormatosDeEstante({ aoFechar }: { aoFechar: () => void }) {
  const { message, modal } = App.useApp()
  const formatos = useFormatos()
  const salvar = useSalvarFormato()
  const estreita = useTelaEstreita()
  const [editando, setEditando] = useState<Formato | 'novo' | null>(null)

  function remover(formato: Formato) {
    void modal.confirm({
      title: `Remover o formato ${formato.nome}?`,
      content: 'Ele sai da lista de formatos.',
      okText: 'Remover',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () =>
        salvar.mutateAsync({ tipo: 'remover', id: formato.id }).then(
          () => void message.success(`Formato ${formato.nome} removido.`),
          (erro: Error) => void message.error(motivoDaFalha(erro)),
        ),
    })
  }

  // o formato em uso não sai: o botão fica desabilitado e o título diz quem usa
  const removerOuNao = (formato: Formato) => {
    const emUso = formato.estantes.length > 0

    return (
      <Botao
        variante={estreita ? 'secundario' : 'fantasma'}
        disabled={emUso}
        {...(emUso ? { title: usadoPor(formato) } : {})}
        onClick={() => remover(formato)}
      >
        Remover
      </Botao>
    )
  }

  return (
    <Janela open title="Formatos de estante" onCancel={aoFechar} footer={null} width={760}>
      <div className="formatos__barra">
        <Botao variante="primario" onClick={() => setEditando('novo')}>
          Novo formato
        </Botao>
      </div>
      <EstadoDaConsulta consulta={formatos} rotulo="Carregando os formatos…">
        {estreita ? (
          <ListaDeCartoes
            itens={formatos.data ?? []}
            chave={(formato) => formato.id}
            rotulo="Formatos"
            vazio="Nenhum formato cadastrado."
            renderizar={(formato) => (
              <>
                <ListaDeCartoes.Topo
                  lado={<span className="formatos__lado">{caixas(formato)}</span>}
                >
                  {formato.nome}
                </ListaDeCartoes.Topo>
                <ListaDeCartoes.Dados>
                  <ListaDeCartoes.Dado rotulo="Faces">{formato.faces}</ListaDeCartoes.Dado>
                  <ListaDeCartoes.Dado rotulo="Linhas × colunas">
                    {formato.linhas} × {formato.colunas}
                  </ListaDeCartoes.Dado>
                  <ListaDeCartoes.Dado rotulo="Estantes" largo>
                    {estantesDoFormato(formato)}
                  </ListaDeCartoes.Dado>
                </ListaDeCartoes.Dados>
                <ListaDeCartoes.Acoes>
                  <Botao onClick={() => setEditando(formato)}>Editar</Botao>
                  {removerOuNao(formato)}
                </ListaDeCartoes.Acoes>
              </>
            )}
          />
        ) : (
          <Table<Formato>
            rowKey="id"
            dataSource={formatos.data ?? []}
            pagination={false}
            scroll={{ x: true }}
            locale={{ emptyText: 'Nenhum formato cadastrado.' }}
            columns={[
              { title: 'Formato', dataIndex: 'nome' },
              { title: 'Faces', dataIndex: 'faces' },
              {
                title: 'Linhas × colunas',
                render: (_, formato) => `${formato.linhas} × ${formato.colunas}`,
              },
              { title: 'Caixas', dataIndex: 'capacidade' },
              { title: 'Estantes', render: (_, formato) => estantesDoFormato(formato) },
              {
                title: '',
                align: 'right',
                render: (_, formato) => (
                  <Linha espaco={4} distribuicao="flex-end" estilo={{ flexWrap: 'nowrap' }}>
                    <Botao variante="fantasma" onClick={() => setEditando(formato)}>
                      Editar
                    </Botao>
                    {removerOuNao(formato)}
                  </Linha>
                ),
              },
            ]}
          />
        )}
      </EstadoDaConsulta>
      {editando && (
        <FormularioDoFormato
          formato={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      )}
    </Janela>
  )
}

const OPCOES_DE_FACES = [
  { value: 1, label: '1 face' },
  { value: 2, label: '2 faces' },
]

const CAMPOS_DO_FORMATO: (keyof DadosDoFormato)[] = ['nome', 'faces', 'linhas', 'colunas']

/**
 * O cadastro e a edição do formato: o nome e as medidas, com a estante em miniatura. As medidas
 * valem também para as estantes que usam o formato, e a API recusa a que deixaria caixa de fora
 */
export function FormularioDoFormato({
  formato,
  aoFechar,
  aoSalvar,
}: {
  formato: Formato | null
  aoFechar: () => void
  /** depois de gravado, com o formato como a API devolveu: a estante escolhe o que acabou de nascer */
  aoSalvar?: (formato: Formato) => void
}) {
  const { message } = App.useApp()
  const salvar = useSalvarFormato()
  const [form] = Form.useForm<DadosDoFormato>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DO_FORMATO)
  // o campo apagado vem null, e a miniatura some até ele voltar
  const medidas = medidasQueCabem(
    Form.useWatch('faces', form),
    Form.useWatch('linhas', form),
    Form.useWatch('colunas', form),
  )
  const uso = formato ? avisoDoUso(formato) : null

  function enviar(campos: DadosDoFormato) {
    const nome = campos.nome.trim()
    const aviso = (texto: string) => ({
      onSuccess: (salvo: Formato | undefined) => {
        void message.success(texto)
        if (salvo) aoSalvar?.(salvo)
        aoFechar()
      },
      onError: falha.mostrar,
    })

    falha.limpar()
    if (!formato) {
      salvar.mutate(
        {
          tipo: 'criar',
          dados: { nome, faces: campos.faces, linhas: campos.linhas, colunas: campos.colunas },
        },
        aviso(`Formato ${nome} cadastrado.`),
      )
      return
    }

    // só o que mudou, ao menos um
    const dados: Partial<DadosDoFormato> = {
      ...(nome === formato.nome ? {} : { nome }),
      ...(campos.faces === formato.faces ? {} : { faces: campos.faces }),
      ...(campos.linhas === formato.linhas ? {} : { linhas: campos.linhas }),
      ...(campos.colunas === formato.colunas ? {} : { colunas: campos.colunas }),
    }
    if (Object.keys(dados).length === 0) return aoFechar()

    salvar.mutate({ tipo: 'alterar', id: formato.id, dados }, aviso(`Formato ${nome} salvo.`))
  }

  return (
    <Janela
      open
      title={formato ? `Editar formato · ${formato.nome}` : 'Novo formato'}
      okText={formato ? 'Salvar' : 'Cadastrar formato'}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
    >
      <Form
        form={form}
        name="formato"
        layout="vertical"
        onFinish={enviar}
        initialValues={
          formato
            ? {
                nome: formato.nome,
                faces: formato.faces,
                linhas: formato.linhas,
                colunas: formato.colunas,
              }
            : // o formato novo começa com duas faces, como os da spec do cliente
              { faces: 2 }
        }
      >
        {(falha.erro || uso) && (
          <div className="formatos__avisos">
            {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
            {uso && <Aviso tom="informacao" titulo={uso} />}
          </div>
        )}
        <Form.Item
          name="nome"
          label="Nome"
          rules={[{ required: true, whitespace: true, message: 'Informe o nome do formato' }]}
        >
          <Input placeholder="ALESCO Modelo 1" maxLength={60} />
        </Form.Item>
        <Form.Item name="faces" label="Faces">
          <Segmented<number> block options={OPCOES_DE_FACES} />
        </Form.Item>
        <div className="formatos__medidas">
          <Form.Item
            name="linhas"
            label="Linhas"
            rules={[{ required: true, message: `De 1 a ${MAIOR_MEDIDA}` }]}
          >
            <InputNumber
              min={1}
              max={MAIOR_MEDIDA}
              precision={0}
              inputMode="numeric"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="colunas"
            label="Colunas"
            // com duas faces, a traseira usa as letras depois da frontal
            dependencies={['faces']}
            rules={[
              { required: true, message: `De 1 a ${MAIOR_MEDIDA}` },
              ({ getFieldValue }) => ({
                validator: (_, colunas?: number | null) =>
                  !colunas || Number(getFieldValue('faces')) * colunas <= MAXIMO_DE_LETRAS
                    ? Promise.resolve()
                    : Promise.reject(new Error(MENSAGEM_DAS_LETRAS)),
              }),
            ]}
          >
            <InputNumber
              min={1}
              max={MAIOR_MEDIDA}
              precision={0}
              inputMode="numeric"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
        {medidas && <MiniaturaDaEstante medidas={medidas} />}
      </Form>
    </Janela>
  )
}
