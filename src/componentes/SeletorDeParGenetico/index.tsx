import { Select } from 'antd'
import { useCatalogoComReserva } from '../_catalogo'

/** Par genético do casal - RN-02, a rotação em anel */
export function SeletorDeParGenetico({
  value,
  onChange,
  id,
}: {
  /** O par, como no contrato: 'AB'. */
  value?: string
  onChange?: (valor: string) => void
  id?: string
}) {
  const { catalogo, carregando } = useCatalogoComReserva()

  return (
    <Select<string>
      {...(id ? { id } : {})}
      {...(value === undefined ? {} : { value })}
      {...(onChange ? { onChange } : {})}
      loading={carregando}
      placeholder="Par genético"
      style={{ width: '100%' }}
      options={catalogo.paresGeneticos.map((par) => ({
        value: par,
        label: `${par} — macho ${par[0]} × fêmea ${par[1]}`,
      }))}
    />
  )
}
