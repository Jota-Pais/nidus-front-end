/**
 * Forma das credenciais, separada da tela para ser testável.
 *
 * `RNF-07` — coleta mínima de dado pessoal: e-mail institucional e senha, nada
 * além disso. O corpo é exatamente o que o `contrato-api.md` §3 espera em
 * `POST /api/sessao`.
 */
import { z } from 'zod'

export const credenciais = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail institucional')
    .email('E-mail inválido — use o formato nome@ufsc.br'),
  senha: z.string().min(1, 'Informe a senha'),
})

export type Credenciais = z.infer<typeof credenciais>

/**
 * Liga um campo do schema Zod ao `rules` do Ant Design, sem duplicar a regra.
 *
 * A assinatura é a que o `Form.Item` espera de um validador. Fica declarada
 * aqui em vez de importada do antd porque `Rule` é união e não expõe
 * `validator` diretamente — e assim trocar de biblioteca de formulário não
 * mexe no schema.
 */
type Validador = (regra: unknown, valor: unknown) => Promise<void>

export function validadorDeCampo(campo: keyof Credenciais): Validador {
  return (_regra, valor) => {
    const resultado = credenciais.shape[campo].safeParse(valor ?? '')
    return resultado.success
      ? Promise.resolve()
      : Promise.reject(new Error(resultado.error.issues[0]?.message))
  }
}
