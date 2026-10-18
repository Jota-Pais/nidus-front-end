import { InboxOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { IconeEmCaixa } from '../IconeEmCaixa'
import './estilos.css'

/** lista vazia */
export function Vazio({ descricao }: { descricao: ReactNode }) {
  return (
    <div className="vazio">
      <IconeEmCaixa neutro>
        <InboxOutlined />
      </IconeEmCaixa>
      <p className="vazio__texto">{descricao}</p>
    </div>
  )
}
