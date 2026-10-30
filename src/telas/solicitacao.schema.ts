// regras dos campos do pedido de animais, separadas da tela para serem testáveis
import { z } from 'zod'
import type { NovaSolicitacao } from '@/dominio/consultas'
import type { CodigoEspecie, Cronograma } from '@/dominio/tipos'
import { faixaDeIdade, totalDeAnimais } from '@/dominio/solicitacao'
import type { CamposDeIdade } from '@/dominio/solicitacao'
import { hoje } from '@/lib/data'
import { validadorDoZod } from '@/lib/validacao'

/** O número de processo da UFSC, como a pessoa vê no parecer da CEUA */
export const FORMATO_DO_PROTOCOLO = '23080.XXXXXX/AAAA-XX'

/** Os limites do banco: idade de 21 a 300 dias (o teto do formulário do cliente) */
export const IDADE = { minima: 21, maxima: 300 }

const MAXIMO_DE_ANIMAIS = 9999

/**
 * Põe a pontuação no protocolo completo: os 17 dígitos, digitados ou colados com ou sem ponto,
 * barra e hífen. Com outra quantidade de dígitos o texto volta como veio e não passa na regra.
 * Não roda enquanto se digita, porque reescrever o campo a cada tecla joga o cursor para o fim
 */
export function formatarProtocolo(valor: string): string {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 17) return valor.trim()

  return `${digitos.slice(0, 5)}.${digitos.slice(5, 11)}/${digitos.slice(11, 15)}-${digitos.slice(15)}`
}

/** A idade em dias. O pedido começa em 21 (o desmame); a busca do técnico aceita menos */
function regraDeIdade(minima: number) {
  return z
    .number({ error: 'Informe a idade' })
    .int('Use dias inteiros')
    .min(minima, `Mínimo de ${minima} dias`)
    .max(IDADE.maxima, `Máximo de ${IDADE.maxima} dias`)
}

const idade = regraDeIdade(IDADE.minima)

/** O validador do 'rules' do Ant Design para a idade, com o mínimo de quem usa o campo */
export function validadorDeIdade(minima: number = IDADE.minima) {
  return validadorDoZod(regraDeIdade(minima))
}

export const solicitacao = z.object({
  nomePesquisador: z
    .string()
    .trim()
    .min(1, 'Informe o seu nome')
    .max(120, 'O nome passa de 120 caracteres'),
  // O formato fica escrito embaixo do campo, então o erro não o repete
  protocoloCeua: z.preprocess(
    (valor) => (typeof valor === 'string' ? formatarProtocolo(valor) : valor),
    z
      .string()
      .min(1, 'Informe o protocolo')
      .regex(/^23080\.\d{6}\/\d{4}-\d{2}$/, 'Confira o número do protocolo'),
  ),
  // Campo vazio vale zero: quem quer só "qualquer sexo" deixa machos e fêmeas em branco
  quantidade: z.preprocess(
    (valor) => (valor === '' || valor === null || valor === undefined ? 0 : valor),
    z
      .number()
      .int('Use números inteiros')
      .min(0, 'Não pode ser negativo')
      .max(MAXIMO_DE_ANIMAIS, `No máximo ${MAXIMO_DE_ANIMAIS}`),
  ),
  idade,
  dataEntrega: z
    .string()
    .min(1, 'Informe a data')
    .refine((data) => data >= hoje(), 'A data já passou'),
  observacoes: z.string().trim().max(500, 'As observações passam de 500 caracteres'),
})

/** O validador do 'rules' do Ant Design para um campo do pedido */
export function validadorDoPedido(campo: keyof typeof solicitacao.shape) {
  return validadorDoZod(solicitacao.shape[campo])
}

/**
 * A ponta de cima da faixa olha a de baixo. Com as duas em branco, o aviso fica só no mínimo,
 * para não sair repetido. Devolve a mensagem de erro, ou null quando está certo
 */
export function conferirIdadeMaxima(
  minimo: number | null | undefined,
  maximo: number | null | undefined,
  idadeMinima: number = IDADE.minima,
): string | null {
  if (maximo === null || maximo === undefined) {
    return typeof minimo === 'number' ? 'Informe até que idade' : null
  }
  if (typeof minimo === 'number' && maximo < minimo) return 'Menor que a idade inicial'

  const resultado = regraDeIdade(idadeMinima).safeParse(maximo)
  return resultado.success ? null : (resultado.error.issues[0]?.message ?? null)
}

/** O que o formulário guarda. Os números vêm nulos quando o campo está em branco */
export interface CamposDoPedido extends CamposDeIdade {
  nomePesquisador: string
  protocoloCeua: string
  especie: CodigoEspecie
  idLinhagem: number
  machos?: number | null
  femeas?: number | null
  qualquer?: number | null
  dataEntrega: string
  cronograma: Cronograma
  observacoes?: string
}

export const PECA_UM_ANIMAL = 'Peça ao menos um animal'

/** A regra que olha os três números juntos: o pedido não pode sair com zero animais */
export function temAnimal(campos: Pick<CamposDoPedido, 'machos' | 'femeas' | 'qualquer'>) {
  return totalDeAnimais(campos) > 0
}

/** Do formulário para o corpo do POST */
export function montarPedido(campos: CamposDoPedido): NovaSolicitacao {
  const observacoes = campos.observacoes?.trim()

  return {
    nomePesquisador: campos.nomePesquisador.trim(),
    protocoloCeua: formatarProtocolo(campos.protocoloCeua),
    idLinhagem: campos.idLinhagem,
    machos: campos.machos ?? 0,
    femeas: campos.femeas ?? 0,
    qualquer: campos.qualquer ?? 0,
    ...faixaDeIdade(campos),
    dataEntrega: campos.dataEntrega,
    cronograma: campos.cronograma,
    ...(observacoes ? { observacoes } : {}),
  }
}
