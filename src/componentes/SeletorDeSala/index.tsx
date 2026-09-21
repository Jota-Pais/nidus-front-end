import { Select } from 'antd'
import { SALAS_DO_ANEXO } from '../_catalogo'

/** sala de criação */
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
