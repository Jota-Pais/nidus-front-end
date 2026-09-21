import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd'

/** Campo numérico */
export function EntradaNumero({ ...props }: InputNumberProps<number>) {
  return (
    <InputNumber<number>
      min={0}
      precision={0}
      inputMode="numeric"
      style={{ width: '100%' }}
      {...props}
    />
  )
}
