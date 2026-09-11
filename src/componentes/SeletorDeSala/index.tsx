import { Select } from 'antd'
import { SALAS_DO_ANEXO } from '../_catalogo'

/**
 * Sala de criação.
 *
 * A infraestrutura atual tem três salas independentes (Anexo A). É filtro de
 * grade, de quadro e de relatório: "o que está acontecendo na Sala 2" é a
 * pergunta que o técnico faz ao começar o turno.
 *
 * ⚠️ **A lista padrão é a do Anexo A, não a do servidor.** O
 * `contrato-api.md` §4 devolve `salas` em `GET /api/catalogo`, mas o tipo
 * `Catalogo` de `@/dominio/useCatalogo` ainda não transcreveu o campo — ver
 * `_catalogo.ts`. Passar `salas` por propriedade sobrescreve, e é o que a
 * tela deve fazer assim que o campo existir.
 */
export function SeletorDeSala({
  value,
  onChange,
  salas = SALAS_DO_ANEXO,
  id,
  permiteTodas = true,
}: {
  value?: string | null
  onChange?: (valor: string | null) => void
  salas?: string[]
  id?: string
  permiteTodas?: boolean
}) {
  const opcoes = salas.map((sala) => ({ value: sala, label: sala }))

  return (
    <Select<string | null>
      {...(id ? { id } : {})}
      value={value ?? null}
      onChange={(escolhida) => onChange?.(escolhida)}
      options={permiteTodas ? [{ value: null, label: 'Todas as salas' }, ...opcoes] : opcoes}
      placeholder="Sala"
      allowClear={permiteTodas}
      style={{ width: '100%' }}
    />
  )
}
