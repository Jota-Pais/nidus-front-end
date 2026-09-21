import { Input } from 'antd'
import type { InputProps } from 'antd'
import { MASCARA_PROJETO_ETICA } from '@/fixtures/catalogo'
import { formatarProjeto } from './mascara'

/** número do projeto de ética - RF-DEM-06. */
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
