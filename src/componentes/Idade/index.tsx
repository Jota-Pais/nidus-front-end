import { Tooltip } from 'antd'
import './estilos.css'

/**
 * Idade em dias inteiros.
 *
 * ⚠️ **O número vem pronto do servidor** (`RNF-01`). Este componente formata,
 * não conta — `idadeEmDias` de `@/lib/data` existe para rótulo auxiliar e
 * validação de formulário, e o que o usuário lê tem que ser o número que a
 * API mandou.
 *
 * ⚠️ **`CONF-01` está em aberto e muda tudo.** A seção 1.6 da spec conta a
 * idade da data de nascimento; a 6.1 conta da data de desmame. São 22 dias de
 * diferença. Enquanto o cliente não responde, o `title` diz de onde o número
 * saiu — não é firula: um técnico lendo "23 dias" sem saber a base pode
 * separar o animal errado.
 */
export function Idade({
  dias,
  base,
}: {
  dias: number | null | undefined
  /** De onde se conta. Enquanto `CONF-01` não fecha, deve ser sempre dito. */
  base?: 'nascimento' | 'desmame'
}) {
  if (dias === null || dias === undefined) {
    return <span className="idade idade--ausente">—</span>
  }

  const texto = `${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const conteudo = <span className="idade">{texto}</span>

  if (!base) return conteudo

  return (
    <Tooltip title={`${texto} contados a partir do ${base}.`}>
      <span className="idade idade--comBase">{texto}</span>
    </Tooltip>
  )
}
