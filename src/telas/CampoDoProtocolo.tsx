import type { InputProps, InputRef } from 'antd'
import { useRef } from 'react'
import type { FocusEvent } from 'react'
import { Entrada, Formulario } from '@/componentes'
import { digitarProtocolo, formatarProtocolo, protocoloCeua } from '@/dominio/protocolo'
import { validadorDoZod } from '@/lib/validacao'
import './CampoDoProtocolo.css'

const conferir = validadorDoZod(protocoloCeua)

/** Os dois formatos que a CEUA da UFSC usa, um em cada linha */
const AJUDA = (
  <>
    Processo <span className="campoDoProtocolo__formato">23080.XXXXXX/AAAA-XX</span>
    <br />
    ou nº do Sistema CEUA (10&nbsp;dígitos)
  </>
)

/**
 * O número do projeto CEUA: o protocolo no pedido de animais e o número no cadastro do projeto,
 * com a mesma regra nos dois, para o gestor não cadastrar um número que o pesquisador não
 * consegue digitar. Confere ao sair do campo, que é quando o número fica na forma da API
 */
export function CampoDoProtocolo({
  name,
  rotulo,
  className,
}: {
  name: string
  rotulo: string
  className?: string
}) {
  return (
    <Formulario.Campo
      name={name}
      rotulo={rotulo}
      ajuda={AJUDA}
      // Só a marca de obrigatório, no formulário que a mostra: quem recusa o vazio é a regra
      required
      validateTrigger="onBlur"
      rules={[{ validator: conferir }]}
      {...(className ? { className } : {})}
    >
      <EntradaDoProtocolo />
    </Formulario.Campo>
  )
}

type PropsDaEntrada = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string
  onChange?: (numero: string) => void
}

/**
 * A entrada com a máscara. O Form.Item passa o valor, o onChange, o onBlur que confere e os
 * atributos de acessibilidade; o onChange recebe o texto já com a máscara
 */
function EntradaDoProtocolo({ value = '', onChange, onBlur, ...props }: PropsDaEntrada) {
  const entrada = useRef<InputRef>(null)

  // O evento do Input do antd traz uma cópia do campo: o texto e o cursor vêm do campo real
  function digitar() {
    const campo = entrada.current?.input
    if (!campo) return

    const digitado = digitarProtocolo(campo.value, campo.selectionStart ?? campo.value.length)
    // O campo já sai daqui com a máscara e o cursor no lugar. Quando o React põe o valor novo,
    // acha o campo igual e não o reescreve; reescrito, o cursor pularia para o fim
    campo.value = digitado.texto
    campo.setSelectionRange(digitado.cursor, digitado.cursor)
    onChange?.(digitado.texto)
  }

  function sair(evento: FocusEvent<HTMLInputElement>) {
    const pronto = formatarProtocolo(value)
    if (pronto !== value) onChange?.(pronto)
    onBlur?.(evento)
  }

  return (
    <Entrada
      {...props}
      ref={entrada}
      value={value}
      onChange={digitar}
      onBlur={sair}
      className="campoDoProtocolo__entrada"
      inputMode="numeric"
      autoComplete="off"
    />
  )
}
