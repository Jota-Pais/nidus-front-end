// forma das credenciais, separada da tela para ser testável
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

/** liga um campo do schema Zod ao 'rules' do Ant Design, sem duplicar a regra */
type Validador = (regra: unknown, valor: unknown) => Promise<void>

export function validadorDeCampo(campo: keyof Credenciais): Validador {
  return (_regra, valor) => {
    const resultado = credenciais.shape[campo].safeParse(valor ?? '')
    return resultado.success
      ? Promise.resolve()
      : Promise.reject(new Error(resultado.error.issues[0]?.message))
  }
}
