import { Form } from 'antd'
import type { FormInstance } from 'antd'
import { Aviso } from '@/componentes'
import { foraDaRegraDeCruzamento } from '@/dominio/caixa'
import { useCatalogo } from '@/dominio/consultas'

/**
 * Embaixo dos grupos do casal: aparece só quando o par foge da regra de cruzamento da linhagem
 * escolhida (rodízio ou mesma letra, dos Cadastros). Não impede: o casal é salvo do mesmo jeito
 */
export function AvisoDoCruzamento({ form }: { form: FormInstance }) {
  const catalogo = useCatalogo()
  const idLinhagem = Form.useWatch<number | undefined>('idLinhagem', form)
  const macho = Form.useWatch<string | undefined>('grupoMacho', form)
  const femea = Form.useWatch<string | undefined>('grupoFemea', form)

  const linhagem = (catalogo.data?.especies ?? [])
    .flatMap((e) => e.linhagens)
    .find((l) => l.id === idLinhagem)
  const texto = foraDaRegraDeCruzamento(linhagem, macho, femea)

  if (texto === null) return null

  return (
    <Aviso tom="erro" titulo="Par fora da regra de cruzamento" style={{ marginBottom: 12 }}>
      {texto} Dá para salvar assim mesmo.
    </Aviso>
  )
}
