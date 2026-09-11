import { Segmented, Select } from 'antd'
import type { CodigoEspecie } from '@/dominio/tipos'
import { useCatalogoComReserva } from '../_catalogo'

/**
 * Escolha de espécie — rato ou camundongo.
 *
 * ⚠️ **No quadro, isto não é filtro: é qual quadro está aberto.** O
 * `RF-CIC-01` manda um quadro por espécie, **sem mistura**, com a segregação
 * aplicada no servidor — o front pede uma espécie e recebe só ela. Por isso
 * `como="botoes"` é o padrão: um `Segmented` diz "duas visões, você está numa
 * delas", enquanto um `Select` com "Todas" mentiria sobre existir uma visão
 * misturada.
 *
 * `como="lista"` existe para formulário, onde a espécie é um campo entre
 * outros e um par de botões grandes desequilibraria o layout.
 */
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
