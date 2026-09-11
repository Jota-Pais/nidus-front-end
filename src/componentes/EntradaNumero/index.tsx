import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd'

/**
 * Campo numérico.
 *
 * Três padrões que a tela não precisa mais lembrar, e que custam caro quando
 * faltam:
 *
 * - **`inputMode="numeric"`** abre o teclado numérico no tablet. O `RNF-03`
 *   diz que o técnico registra de luvas, dentro da sala; procurar dígito no
 *   teclado alfabético de luva é o caminho para o número errado.
 * - **`precision={0}`** — o domínio conta **animal**, e meio animal não
 *   existe. Sem isso o campo aceita `4,5` e o erro só aparece no servidor.
 * - **`min={0}`** pela mesma razão.
 *
 * ⚠️ Passe `max` só onde o contrato tem um teto de verdade — o
 * `eutanasiado ≤ nascido` do `RF-REP-04`. A constante de 4M/4F é
 * **expectativa** de ninhada, não limite, e o requisito é explícito: quem
 * decide quantos permanecem é o técnico.
 */
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
