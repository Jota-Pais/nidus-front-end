import { Spin } from 'antd'
import { Texto } from '@/componentes/Texto'
import './carregando.css'

/** estado de carregamento padronizado. Nenhuma tela inventa o seu */
export function Carregando({ rotulo = 'Carregando…' }: { rotulo?: string }) {
  return (
    <div className="carregando" role="status" aria-live="polite">
      <Spin size="large" />
      <Texto tom="secundario">{rotulo}</Texto>
    </div>
  )
}
