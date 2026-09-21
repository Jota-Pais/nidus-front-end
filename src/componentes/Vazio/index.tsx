import { InboxOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { IconeEmCaixa } from '../IconeEmCaixa'
import './estilos.css'

/** lista vazia */
export function Vazio({
  descricao,
  filtrado = false,
  icone,
  acao,
}: {
  descricao: ReactNode
  /** 'true' quando há filtro aplicado: muda a mensagem e sugere limpar */
  filtrado?: boolean
  icone?: ReactNode
  acao?: ReactNode
}) {
  return (
    <div className="vazio">
      <IconeEmCaixa tamanho="lg" neutro>
        {icone ?? <InboxOutlined />}
      </IconeEmCaixa>
      <p className="vazio__texto">
        {filtrado ? 'Nada encontrado com os filtros atuais.' : descricao}
      </p>
      {acao}
    </div>
  )
}
