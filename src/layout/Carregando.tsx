import { Spin } from 'antd'
import { Texto } from '@/componentes/Texto'
import './carregando.css'

/**
 * Estado de carregamento padronizado. Nenhuma tela inventa o seu.
 *
 * ⚠️ Para lista e tabela, prefira o `Esqueleto`: a forma já é conhecida, e
 * preservar a altura da área evita o salto de layout que faz o técnico clicar
 * no lugar errado quando o conteúdo chega.
 */
export function Carregando({ rotulo = 'Carregando…' }: { rotulo?: string }) {
  return (
    <div className="carregando" role="status" aria-live="polite">
      <Spin size="large" />
      <Texto tom="secundario">{rotulo}</Texto>
    </div>
  )
}
