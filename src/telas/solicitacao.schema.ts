// regras dos campos do pedido de animais, separadas da tela para serem testáveis
import { z } from 'zod'
import type { NovaSolicitacao } from '@/dominio/consultas'
import type { CodigoEspecie, Cronograma } from '@/dominio/tipos'
import { totalDeAnimais } from '@/dominio/solicitacao'
import { hoje } from '@/lib/data'
import { validadorDoZod } from '@/lib/validacao'

/** O número de processo da UFSC, como a pessoa vê no parecer da CEUA */
export const FORMATO_DO_PROTOCOLO = '23080.XXXXXX/AAAA-XX'

/** Os limites do banco: idade de 21 a 300 dias (o teto do formulário do cliente) */
export const IDADE = { minima: 21, maxima: 300 }

const MAXIMO_DE_ANIMAIS = 9999

/**
 * Põe a pontuação do protocolo enquanto se digita, e aceita colar com ou sem ela. O
 * separador só entra quando chega o dígito seguinte: assim o Backspace apaga o número e
 * não fica preso no ponto
 */
export function mascararProtocolo(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 17)
  const partes = [
    digitos.slice(0, 5),
    digitos.slice(5, 11),
    digitos.slice(11, 15),
    digitos.slice(15),
  ]
  const separadores = ['.', '/', '-']

  return partes.reduce((texto, parte, i) =>
    parte ? texto + (separadores[i - 1] ?? '') + parte : texto,
  )
}

const idade = z
  .number({ error: 'Informe a idade' })
  .int('Use dias inteiros')
  .min(IDADE.minima, `Mínimo de ${IDADE.minima} dias`)
  .max(IDADE.maxima, `Máximo de ${IDADE.maxima} dias`)

export const solicitacao = z.object({
  nomePesquisador: z
    .string()
    .trim()
    .min(1, 'Informe o seu nome')
    .max(120, 'O nome passa de 120 caracteres'),
  // O formato fica escrito embaixo do campo, então o erro não o repete
  protocoloCeua: z.string().regex(/^23080\.\d{6}\/\d{4}-\d{2}$/, 'Confira o número do protocolo'),
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

/** O que o formulário guarda. Os números vêm nulos quando o campo está em branco */
export interface CamposDoPedido {
  nomePesquisador: string
  protocoloCeua: string
  especie: CodigoEspecie
  idLinhagem: number
  modoIdade: 'faixa' | 'exata'
  idadeMin: number
  idadeMax?: number | null
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

/** Do formulário para o corpo do POST. Na idade exata, o máximo é o próprio mínimo */
export function montarPedido(campos: CamposDoPedido): NovaSolicitacao {
  const observacoes = campos.observacoes?.trim()

  return {
    nomePesquisador: campos.nomePesquisador.trim(),
    protocoloCeua: campos.protocoloCeua,
    idLinhagem: campos.idLinhagem,
    machos: campos.machos ?? 0,
    femeas: campos.femeas ?? 0,
    qualquer: campos.qualquer ?? 0,
    idadeMin: campos.idadeMin,
    idadeMax: campos.modoIdade === 'exata' ? campos.idadeMin : (campos.idadeMax ?? campos.idadeMin),
    dataEntrega: campos.dataEntrega,
    cronograma: campos.cronograma,
    ...(observacoes ? { observacoes } : {}),
  }
}
