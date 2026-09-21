import { Tag, Tooltip } from 'antd'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'

/** qual perfil o usuário tem - 'RF-ACS-*'. */
export function TagDePerfil({ perfil }: { perfil: Perfil }) {
  const meta = PERFIS[perfil]
  return (
    <Tooltip title={meta.descricao}>
      <Tag bordered>{meta.rotulo}</Tag>
    </Tooltip>
  )
}
