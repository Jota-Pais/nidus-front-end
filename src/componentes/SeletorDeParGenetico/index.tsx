import { Select } from 'antd'
import { useCatalogoComReserva } from '../_catalogo'

/**
 * Par genético do casal — `RN-02`, a rotação em anel.
 *
 * Os pares permitidos são `AB`, `BC`, `CD`, `DE`, `EA`, e o **primeiro
 * caractere é o grupo do macho**. A rotação existe para evitar
 * consanguinidade, e é por isso que a lista não é o produto de A–E por A–E:
 * de 25 combinações, 5 são válidas.
 *
 * ⚠️ **Oferecer só o que vale não é validar** (`RF-ACS-02`, `RNF-01`). O
 * servidor continua recusando com `409 PAR_GENETICO_INVALIDO` — este seletor
 * evita a viagem, não a regra.
 *
 * ⚠️ E a lista é **configurável** (`RNF-05`): vem do catálogo, com o Anexo A
 * como reserva. Nunca escrever os cinco pares no meio de uma tela.
 */
export function SeletorDeParGenetico({
  value,
  onChange,
  id,
}: {
  /** O par, como no contrato: `'AB'`. */
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
