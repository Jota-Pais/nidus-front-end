// forma das credenciais, separada da tela para ser testável
import { z } from 'zod'
import { validadorDoZod } from '@/lib/validacao'

export const credenciais = z.object({
  // Em minúsculas, como a conta é gravada no primeiro acesso: o teclado do celular põe a
  // inicial maiúscula, e o banco compara letra por letra
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe o e-mail institucional')
    .email('E-mail inválido — use o formato nome@ufsc.br'),
  senha: z.string().min(1, 'Informe a senha'),
})

export type Credenciais = z.infer<typeof credenciais>

/** O validador do 'rules' do Ant Design para um campo das credenciais */
export function validadorDeCampo(campo: keyof Credenciais) {
  return validadorDoZod(credenciais.shape[campo])
}
