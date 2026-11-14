import { App, Form, Input, Select } from 'antd'
import { Janela } from '@/componentes'
import { useEstantes, useSalas, useSalvarEstante } from '@/dominio/consultas'
import { proximoNumeroDeEstante } from '@/dominio/estante'
import type { Estante } from '@/dominio/tipos'
import { motivoDaFalha } from '@/layout/useFalhaDoFormulario'

/** Os quatro modelos de estante da spec do cliente (seção 1.2), todos com duas faces */
const MODELOS = [
  { fabricante: 'ALESCO', modelo: 'Modelo 1', linhas: 8, colunas: 8 },
  { fabricante: 'ALESCO', modelo: 'Modelo 2', linhas: 5, colunas: 5 },
  { fabricante: 'TECNIPLAST', modelo: 'Modelo 1', linhas: 8, colunas: 7 },
  { fabricante: 'TECNIPLAST', modelo: 'Modelo 2', linhas: 5, colunas: 4 },
]

function descricaoDoModelo(estante: {
  fabricante: string
  modelo: string
  faces: number
  linhas: number
  colunas: number
}): string {
  return `${estante.fabricante} ${estante.modelo} - ${estante.linhas} x ${estante.colunas} por face (${estante.faces * estante.linhas * estante.colunas} caixas)`
}

interface CamposDaEstante {
  idSala: number
  /** o índice em MODELOS; só no cadastro */
  modelo: number
  numeroVisivel: string
}

export function FormularioDaEstante({
  estante,
  aoFechar,
}: {
  estante: Estante | null
  aoFechar: () => void
}) {
  const { message } = App.useApp()
  const salas = useSalas()
  const estantes = useEstantes()
  const salvar = useSalvarEstante()
  const [form] = Form.useForm<CamposDaEstante>()

  function enviar(campos: CamposDaEstante) {
    const numeroVisivel = campos.numeroVisivel.trim()
    const aviso = (texto: string) => ({
      onSuccess: () => {
        void message.success(texto)
        aoFechar()
      },
      onError: (erro: Error) => void message.error(motivoDaFalha(erro)),
    })

    if (estante) {
      salvar.mutate(
        { tipo: 'alterar', id: estante.id, dados: { numeroVisivel, idSala: campos.idSala } },
        aviso(`Estante ${numeroVisivel} salva.`),
      )
      return
    }

    const modelo = MODELOS[campos.modelo]
    if (!modelo) return

    salvar.mutate(
      { tipo: 'criar', dados: { idSala: campos.idSala, numeroVisivel, faces: 2, ...modelo } },
      aviso(`Estante ${numeroVisivel} cadastrada.`),
    )
  }

  return (
    <Janela
      open
      title={estante ? `Editar estante · ${estante.numeroVisivel}` : 'Nova estante'}
      okText={estante ? 'Salvar' : 'Cadastrar estante'}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={enviar}
        initialValues={
          estante
            ? { idSala: estante.idSala, numeroVisivel: estante.numeroVisivel }
            : {
                idSala: salas.data?.[0]?.id,
                modelo: 0,
                numeroVisivel: proximoNumeroDeEstante(estantes.data ?? []),
              }
        }
      >
        <Form.Item
          name="idSala"
          label="Sala"
          rules={[{ required: true, message: 'Escolha a sala' }]}
        >
          <Select
            options={(salas.data ?? []).map((sala) => ({ value: sala.id, label: sala.nome }))}
            loading={salas.isPending}
            notFoundContent="Cadastre uma sala antes"
          />
        </Form.Item>
        {estante ? (
          <Form.Item
            label="Modelo"
            extra="O modelo não muda depois do cadastro. Para trocar, remova a estante e cadastre de novo."
          >
            <Input value={descricaoDoModelo(estante)} disabled />
          </Form.Item>
        ) : (
          <Form.Item name="modelo" label="Modelo" rules={[{ required: true }]}>
            <Select
              options={MODELOS.map((opcao, indice) => ({
                value: indice,
                label: descricaoDoModelo({ ...opcao, faces: 2 }),
              }))}
            />
          </Form.Item>
        )}
        <Form.Item
          name="numeroVisivel"
          label="Número da estante"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Informe o número, como está na etiqueta. ex: E-05',
            },
          ]}
        >
          <Input placeholder="E-05" maxLength={30} />
        </Form.Item>
      </Form>
    </Janela>
  )
}
