import { Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ErroDeApi } from '@/lib/api'
import { MensagemDeErro } from '../MensagemDeErro'

/**
 * Modal com formulário dentro — o formato de quase todo registro do Nidus:
 * formar casal, parto, seleção, desmame, encerrar casal, cadastrar estante,
 * cadastrar projeto, nova solicitação.
 *
 * Quatro coisas que a tela não precisa mais lembrar de fazer:
 *
 * 1. **`destroyOnHidden`.** Sem isso o modal reabre com o que foi digitado da
 *    vez anterior — registrar o parto da caixa A1 e abrir a A2 já com os
 *    números da A1 preenchidos é como se registra dado errado.
 * 2. **`erro.campos` vai para o campo certo.** O `contrato-api.md` §2 devolve
 *    `{ erro: { campos: { … } } }` e a mensagem no topo não diz *qual* campo
 *    está errado; aqui o erro do servidor marca o campo, como se fosse
 *    validação local.
 * 3. **Enter envia.** É `Form` de verdade com `onFinish`, não `onOk` chamando
 *    função solta: o técnico de luvas digita e aperta Enter.
 * 4. **Botão travado enquanto salva**, com o mesmo texto de sempre.
 *
 * ⚠️ Não valida regra de negócio (`RNF-01`). Validação de formato — campo
 * obrigatório, número não negativo — é do Zod ou das `rules` do campo; o resto
 * é do servidor, e volta pelo caminho do item 2.
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
  /** Só quando a tela precisa ler ou setar campo de fora. Senão, deixe criar. */
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

    // O `name` do `setFields` é tipado a partir de `V`, e o nome do campo vem
    // do servidor — string em tempo de execução, impossível de provar em
    // tempo de compilação. Campo que o formulário não conhece é ignorado
    // pelo Ant Design, então o pior caso é o erro só aparecer no topo.
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
