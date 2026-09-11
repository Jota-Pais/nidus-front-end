import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import type { TextAreaProps } from 'antd/es/input'
import type { SearchProps } from 'antd/es/input/Search'
import { forwardRef } from 'react'

/**
 * Campo de texto.
 *
 * Fino de propósito: a altura de 48px (`RNF-03`), o raio e o anel de foco já
 * vêm do tema. O que ele acrescenta é **vocabulário** — a tela importa tudo
 * de `@/componentes` e não precisa saber que por baixo é Ant Design — e as
 * três variantes num lugar só, com os nomes do projeto.
 *
 * ⚠️ `autoComplete` não tem padrão aqui de propósito. Campo de e-mail quer
 * `username`, senha quer `current-password`, e um valor genérico faria o
 * navegador oferecer o dado errado. Quem sabe é a tela.
 */
export const Entrada = Object.assign(
  forwardRef<InputRef, InputProps>(function Entrada(props, ref) {
    return <Input ref={ref} {...props} />
  }),
  {
    /** Com o olho de mostrar/esconder. */
    Senha: Input.Password,
    /**
     * Texto longo — justificativa, motivo de encerramento, observação.
     * `autoSize` cresce até seis linhas em vez de virar uma janelinha de
     * rolagem: o técnico precisa reler o que escreveu antes de gravar, e o
     * `RNF-06` não deixa apagar depois.
     */
    Area: (props: TextAreaProps) => (
      <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} showCount {...props} />
    ),
    /** Busca de lista. `allowClear` porque filtro que não se desfaz irrita. */
    Busca: (props: SearchProps) => <Input.Search allowClear {...props} />,
  },
)
