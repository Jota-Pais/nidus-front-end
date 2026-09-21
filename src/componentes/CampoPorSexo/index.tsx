import { InputNumber } from 'antd'
import type { PorSexo } from '@/dominio/tipos'
import { VAZIO } from './valor'
import type { ValorPorSexo } from './valor'
import './estilos.css'

/** Par de contagens macho/fêmea */
export function CampoPorSexo({
  value,
  onChange,
  maximo,
  desabilitado = false,
  idMachos,
}: {
  value?: ValorPorSexo | null
  onChange?: (valor: ValorPorSexo) => void
  /** teto por sexo. Só onde o contrato tem um - 'eutanasiado ≤ nascido'. */
  maximo?: PorSexo
  desabilitado?: boolean
  /** Para o '<label>' do campo apontar para a primeira metade do par. */
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
