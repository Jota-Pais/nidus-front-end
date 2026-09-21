import { Segmented, Select } from 'antd'
import type { CodigoEspecie } from '@/dominio/tipos'
import { useCatalogoComReserva } from '../_catalogo'

/** escolha de espécie - rato ou camundongo */
export function SeletorDeEspecie({
  value,
  onChange,
  como = 'botoes',
  id,
  desabilitado = false,
}: {
  value?: CodigoEspecie
  onChange?: (valor: CodigoEspecie) => void
  como?: 'botoes' | 'lista'
  id?: string
  desabilitado?: boolean
}) {
  const { catalogo, carregando } = useCatalogoComReserva()

  const opcoes = catalogo.especies.map((especie) => ({
    value: especie.codigo,
    label: especie.nome,
  }))

  if (como === 'botoes') {
    return (
      <Segmented<CodigoEspecie>
        {...(value === undefined ? {} : { value })}
        {...(onChange ? { onChange } : {})}
        options={opcoes}
        disabled={desabilitado}
        size="large"
      />
    )
  }

  return (
    <Select<CodigoEspecie>
      {...(id ? { id } : {})}
      {...(value === undefined ? {} : { value })}
      {...(onChange ? { onChange } : {})}
      options={opcoes}
      loading={carregando}
      disabled={desabilitado}
      placeholder="Espécie"
      style={{ width: '100%' }}
    />
  )
}
