// forma dos campos do primeiro acesso e da senha esquecida, separada da tela para ser testável
import { z } from 'zod'
import { validadorDoZod } from '@/lib/validacao'

/** O domínio ufsc.br ou um subdomínio dele: grad.ufsc.br, posgrad.ufsc.br */
const DOMINIO_DA_UFSC = /@([a-z0-9-]+\.)*ufsc\.br$/

/** O mínimo do back-end para senha, o mesmo do `npm run db:senha` */
export const TAMANHO_MINIMO_DA_SENHA = 8

/** Os tamanhos das colunas `usuario.email` e `usuario.nome` no banco */
const TAMANHO_MAXIMO = { email: 160, nome: 120 }

export const acesso = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe o seu e-mail da UFSC')
    .max(TAMANHO_MAXIMO.email, `O e-mail passa de ${TAMANHO_MAXIMO.email} caracteres`)
    .email('E-mail inválido — use o formato nome@ufsc.br')
    .regex(DOMINIO_DA_UFSC, 'Use o seu e-mail da UFSC, terminado em ufsc.br'),
  // O código chega no e-mail; quem copia de lá costuma trazer espaço junto
  codigo: z
    .string()
    .transform((valor) => valor.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'O código tem 6 números')),
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o seu nome')
    .max(TAMANHO_MAXIMO.nome, `O nome passa de ${TAMANHO_MAXIMO.nome} caracteres`),
  senha: z
    .string()
    .min(
      TAMANHO_MINIMO_DA_SENHA,
      `A senha precisa de pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`,
    ),
})

export type CamposDeAcesso = z.infer<typeof acesso>

/** O validador do 'rules' do Ant Design para um campo do primeiro acesso */
export function validadorDeAcesso(campo: keyof CamposDeAcesso) {
  return validadorDoZod(acesso.shape[campo])
}
