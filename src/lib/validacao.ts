// liga um schema Zod ao 'rules' do Ant Design, sem duplicar a regra
import type { ZodType } from 'zod'

type Validador = (regra: unknown, valor: unknown) => Promise<void>

/** Valida um campo do formulário com o schema e recusa com a primeira mensagem dele */
export function validadorDoZod(esquema: ZodType): Validador {
  return (_regra, valor) => {
    const resultado = esquema.safeParse(valor ?? '')
    return resultado.success
      ? Promise.resolve()
      : Promise.reject(new Error(resultado.error.issues[0]?.message))
  }
}
