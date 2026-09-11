import { InboxOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { IconeEmCaixa } from '../IconeEmCaixa'
import './estilos.css'

/**
 * Lista vazia.
 *
 * Duas situações que parecem uma só e não são: **não há nada cadastrado** e
 * **o filtro não achou nada**. Quem vê "Nenhuma estante cadastrada" com um
 * filtro de sala ligado vai abrir chamado dizendo que sumiram as estantes.
 *
 * O ícone é neutro, não gradiente: vazio não é destaque, e gastar o acento
 * aqui é gastar onde não há ação nenhuma para oferecer.
 */
export function Vazio({
  descricao,
  filtrado = false,
  icone,
  acao,
}: {
  descricao: ReactNode
  /** `true` quando há filtro aplicado: muda a mensagem e sugere limpar. */
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
