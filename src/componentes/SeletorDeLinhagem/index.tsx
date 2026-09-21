import { Select } from 'antd'
import type { CodigoEspecie } from '@/dominio/tipos'
import { useCatalogoComReserva } from '../_catalogo'

/** linhagem, sempre dentro de uma espécie */
export function SeletorDeLinhagem({
  especie,
  value,
  onChange,
  id,
  permiteTodas = false,
}: {
  especie: CodigoEspecie | null | undefined
  value?: string | null
  onChange?: (valor: string | null) => void
  id?: string
  /** para filtro de tela, onde "qualquer linhagem" é resposta válida */
  permiteTodas?: boolean
}) {
  const { catalogo, carregando } = useCatalogoComReserva()

  const daEspecie = catalogo.especies.find((e) => e.codigo === especie)
  const opcoes = (daEspecie?.linhagens ?? []).map((linhagem) => ({
    value: linhagem,
    label: linhagem,
  }))

  return (
    <Select<string | null>
      {...(id ? { id } : {})}
      value={value ?? null}
      onChange={(escolhido) => onChange?.(escolhido)}
      options={permiteTodas ? [{ value: null, label: 'Todas as linhagens' }, ...opcoes] : opcoes}
      loading={carregando}
      disabled={!especie}
      placeholder={especie ? 'Linhagem' : 'Escolha a espécie primeiro'}
      allowClear={permiteTodas}
      style={{ width: '100%' }}
    />
  )
}
