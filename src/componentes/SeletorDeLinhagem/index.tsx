import { Select } from 'antd'
import type { CodigoEspecie } from '@/dominio/tipos'
import { useCatalogoComReserva } from '../_catalogo'

/**
 * Linhagem, sempre dentro de uma espécie.
 *
 * ⚠️ **A espécie é obrigatória de propósito.** Wistar é rato, C57BL/6J é
 * camundongo, e o contrato recusa (`400 VALIDACAO`) linhagem que não pertence
 * à espécie da caixa (`POST /api/casais`). Uma lista com as cinco linhagens
 * juntas convidaria ao erro e transformaria uma escolha impossível numa
 * viagem de ida e volta ao servidor.
 *
 * Sem espécie escolhida o campo fica desabilitado e diz o que falta, em vez
 * de abrir uma lista vazia — lista vazia parece defeito.
 */
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
  /** Para filtro de tela, onde "qualquer linhagem" é resposta válida. */
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
