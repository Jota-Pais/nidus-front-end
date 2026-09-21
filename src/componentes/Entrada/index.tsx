import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import type { TextAreaProps } from 'antd/es/input'
import type { SearchProps } from 'antd/es/input/Search'
import { forwardRef } from 'react'

/** Campo de texto */
export const Entrada = Object.assign(
  forwardRef<InputRef, InputProps>(function Entrada(props, ref) {
    return <Input ref={ref} {...props} />
  }),
  {
    /** Com o olho de mostrar/esconder */
    Senha: Input.Password,
    /**
     * Texto longo - justificativa, motivo de encerramento, observação. autoSize cresce
     * até seis linhas em vez de virar uma janelinha de rolagem: o técnico precisa reler o
     * que escreveu antes de gravar, e o RNF-06 não deixa apagar depois
     */
    Area: (props: TextAreaProps) => (
      <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} showCount {...props} />
    ),
    /** busca de lista. allowClear pq filtro que não se desfaz irrita */
    Busca: (props: SearchProps) => <Input.Search allowClear {...props} />,
  },
)
