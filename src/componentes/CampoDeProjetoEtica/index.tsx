import { Input } from 'antd'
import type { InputProps } from 'antd'
import { MASCARA_PROJETO_ETICA } from '@/fixtures/catalogo'
import { formatarProjeto } from './mascara'

/**
 * Número do projeto de ética — `RF-DEM-06`.
 *
 * A máscara é aplicada enquanto se digita, então o pesquisador não precisa
 * lembrar onde vai ponto, barra e traço. O `placeholder` é o gabarito do
 * Anexo A.4, que também serve de dica de formato.
 *
 * ⚠️ **Isto não valida projeto.** Formato é uma coisa; projeto existir, estar
 * vigente e ter cota é outra, e é do servidor (`RNF-01`, `RF-DEM-06`). O
 * campo aceitar o texto não quer dizer que a solicitação vai passar.
 *
 * Monoespaçado com `tabular-nums`: é um número que o pesquisador confere
 * dígito a dígito contra o papel do CEUA.
 */
export function CampoDeProjetoEtica({
  value,
  onChange,
  ...resto
}: Omit<InputProps, 'value' | 'onChange'> & {
  value?: string
  onChange?: (valor: string) => void
}) {
  return (
    <Input
      value={value ?? ''}
      onChange={(evento) => onChange?.(formatarProjeto(evento.target.value))}
      placeholder={MASCARA_PROJETO_ETICA}
      inputMode="numeric"
      autoComplete="off"
      style={{ fontFamily: 'var(--fonte-mono)', fontVariantNumeric: 'tabular-nums' }}
      {...resto}
    />
  )
}
