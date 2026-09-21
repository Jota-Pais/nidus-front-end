import { Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ErroDeApi } from '@/lib/api'
import { MensagemDeErro } from '../MensagemDeErro'

/**
 * Modal com formulário dentro - o formato de quase todo registro do Nidus: formar
 * casal, parto, seleção, desmame, encerrar casal, cadastrar estante, cadastrar
 * projeto, nova solicitação.
 */
export function ModalDeFormulario<V extends object>({
  titulo,
  aberto,
  aoFechar,
  aoEnviar,
  children,
  formulario,
  valoresIniciais,
  salvando = false,
  erro,
  rotuloConfirmar = 'Salvar',
  largura = 560,
}: {
  titulo: ReactNode
  aberto: boolean
  aoFechar: () => void
  aoEnviar: (valores: V) => void
  children: ReactNode
  /** Só quando a tela precisa ler ou setar campo de fora. Senão, deixe criar */
  formulario?: FormInstance<V>
  valoresIniciais?: Partial<V>
  salvando?: boolean
  erro?: unknown
  rotuloConfirmar?: string
  largura?: number
}) {
  const [interno] = Form.useForm<V>()
  const form = formulario ?? interno

  useEffect(() => {
    if (!(erro instanceof ErroDeApi)) return
    const campos = Object.entries(erro.campos)
    if (campos.length === 0) return

    // O name do 'setFields' é tipado a partir de V, e o nome do campo vem do
    // servidor - string em tempo de execução, impossível de provar em tempo de
    // compilação. Campo que o formulário não conhece é ignorado pelo Ant Design,
    // então o pior caso é o erro só aparecer no topo
    form.setFields(
      campos.map(([nome, mensagem]) => ({
        name: nome,
        errors: [mensagem],
      })) as Parameters<typeof form.setFields>[0],
    )
  }, [erro, form])

  return (
    <Modal
      open={aberto}
      title={titulo}
      onCancel={aoFechar}
      onOk={() => form.submit()}
      okText={rotuloConfirmar}
      cancelText="Cancelar"
      confirmLoading={salvando}
      maskClosable={!salvando}
      cancelButtonProps={{ disabled: salvando }}
      width={largura}
      destroyOnHidden
    >
      <MensagemDeErro erro={erro} />
      <Form<V>
        form={form}
        layout="vertical"
        requiredMark={false}
        disabled={salvando}
        onFinish={aoEnviar}
        {...(valoresIniciais === undefined ? {} : { initialValues: valoresIniciais })}
        style={{ marginTop: erro ? 16 : 0 }}
      >
        {children}
      </Form>
    </Modal>
  )
}
