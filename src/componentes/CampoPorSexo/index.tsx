import { InputNumber } from 'antd'
import type { PorSexo } from '@/dominio/tipos'
import { VAZIO } from './valor'
import type { ValorPorSexo } from './valor'
import './estilos.css'

/**
 * Par de contagens macho/fêmea.
 *
 * Aparece em **quase todo registro do técnico**: parto (`nascidoM`/`nascidoF`,
 * `RF-REP-03`), eutanásia de seleção (`RF-REP-04`), desmame (`RF-REP-05`) e
 * no pedido da solicitação (`RF-DEM-01`). Contar em dois números separados é
 * do domínio, não da tela: o pesquisador pede por sexo e o motor atende por
 * sexo (`RN-09`).
 *
 * `value`/`onChange` no formato do `Form.Item`, então entra direto no
 * formulário sem adaptador. As funções de valor — `estaCompleto`,
 * `paraPorSexo` — estão em `./valor`.
 *
 * ⚠️ **`maximo` não é teto de protocolo.** O `RF-REP-04` é explícito: quem
 * decide quantos permanecem é o técnico. A única validação legítima é
 * `eutanasiado ≤ nascido`, e é para isso — e só para isso — que `maximo`
 * existe. Passar a constante de 4M/4F aqui seria transformar uma
 * **expectativa** de ninhada não nascida (`CONF-03`, `PEN-05`) em limite, que
 * é exatamente o erro que o requisito manda não cometer.
 *
 * ⚠️ E o teclado abre numérico (`inputMode`): o técnico está de luvas, dentro
 * da sala (`RNF-03`).
 */
export function CampoPorSexo({
  value,
  onChange,
  maximo,
  desabilitado = false,
  idMachos,
}: {
  value?: ValorPorSexo | null
  onChange?: (valor: ValorPorSexo) => void
  /** Teto por sexo. Só onde o contrato tem um — `eutanasiado ≤ nascido`. */
  maximo?: PorSexo
  desabilitado?: boolean
  /** Para o `<label>` do campo apontar para a primeira metade do par. */
  idMachos?: string
}) {
  const atual = value ?? VAZIO

  const alterar = (sexo: 'm' | 'f') => (numero: number | null) => {
    onChange?.({ ...atual, [sexo]: numero })
  }

  return (
    <div className="campoPorSexo" role="group" aria-label="Quantidade por sexo">
      <div className="campoPorSexo__parte">
        <label className="campoPorSexo__marca" htmlFor={idMachos}>
          M
        </label>
        <InputNumber
          {...(idMachos ? { id: idMachos } : {})}
          value={atual.m}
          onChange={alterar('m')}
          min={0}
          {...(maximo === undefined ? {} : { max: maximo.m })}
          precision={0}
          inputMode="numeric"
          disabled={desabilitado}
          aria-label="Machos"
          placeholder="0"
        />
      </div>

      <div className="campoPorSexo__parte">
        <label className="campoPorSexo__marca">F</label>
        <InputNumber
          value={atual.f}
          onChange={alterar('f')}
          min={0}
          {...(maximo === undefined ? {} : { max: maximo.f })}
          precision={0}
          inputMode="numeric"
          disabled={desabilitado}
          aria-label="Fêmeas"
          placeholder="0"
        />
      </div>
    </div>
  )
}
