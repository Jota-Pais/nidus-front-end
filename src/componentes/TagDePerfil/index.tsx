import { Tag, Tooltip } from 'antd'
import { PERFIS } from '@/dominio/tipos'
import type { Perfil } from '@/dominio/tipos'

/**
 * Qual perfil o usuário tem — `RF-ACS-*`.
 *
 * A descrição de cada perfil vai no `title`, e vale a pena: "Pesquisador"
 * sozinho não diz que ele **não enxerga a colônia**, que é a diferença que
 * explica por que a tela dele é outra.
 *
 * ⚠️ **Isto é rótulo, não autorização.** O perfil vem do servidor junto da
 * sessão e é lá que ele decide o que pode (`RF-ACS-02`). Mostrar a etiqueta
 * não autoriza nada, e escondê-la não protege nada.
 */
export function TagDePerfil({ perfil }: { perfil: Perfil }) {
  const meta = PERFIS[perfil]
  return (
    <Tooltip title={meta.descricao}>
      <Tag bordered>{meta.rotulo}</Tag>
    </Tooltip>
  )
}
