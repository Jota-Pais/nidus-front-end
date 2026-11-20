// As caixas que saíram da estante, em palavras: a lista do histórico das estantes
import { formatarData } from '@/lib/data'
import { SIMBOLO_DO_SEXO } from './caixa'
import type { CaixaLiberada, CasalDaCaixaLiberada, MotivoDaLiberacao } from './tipos'

/** O fato que esvaziou a caixa, curto, para a coluna da lista */
export const MOTIVO_DA_LIBERACAO: Record<MotivoDaLiberacao, string> = {
  entrega: 'Entrega',
  baixa: 'Baixa',
  mudanca: 'Mudança',
  casal_encerrado: 'Casal encerrado',
}

const contar = (qtd: number, um: string, varios: string) => `${qtd} ${qtd === 1 ? um : varios}`

/** "Caixa de casal", "Caixa de estoque ♀" */
export function descreverTipo(caixa: Pick<CaixaLiberada, 'tipo' | 'sexo'>): string {
  if (caixa.tipo === 'casal') return 'Caixa de casal'
  return caixa.sexo === null
    ? 'Caixa de estoque'
    : `Caixa de estoque ${SIMBOLO_DO_SEXO[caixa.sexo]}`
}

/** "08/11/2026 · Mudança"; sem data, só o motivo */
export function descreverQuandoSaiu(
  caixa: Pick<CaixaLiberada, 'dtLiberacao' | 'motivoLiberacao'>,
): string {
  const motivo = caixa.motivoLiberacao === null ? null : MOTIVO_DA_LIBERACAO[caixa.motivoLiberacao]
  const quando = caixa.dtLiberacao === null ? null : formatarData(caixa.dtLiberacao)
  return [quando, motivo].filter((parte) => parte !== null).join(' · ') || '—'
}

/** "01/03/2026 a 20/10/2026", ou "desde 01/03/2026" no casal que não encerrou */
export function periodoDoCasal(
  casal: Pick<CasalDaCaixaLiberada, 'dtFormacao' | 'dtEncerramento'>,
): string {
  return casal.dtEncerramento === null
    ? `desde ${formatarData(casal.dtFormacao)}`
    : `${formatarData(casal.dtFormacao)} a ${formatarData(casal.dtEncerramento)}`
}

/**
 * "5 partos, 48 nascidos". Quando o último parto não é o total (o casal cadastrado já no 3º
 * parto), diz até qual foi: "3 partos (até o 5º), 30 nascidos". "Nenhum parto" sem parto nascido
 */
export function descreverPartos(
  casal: Pick<CasalDaCaixaLiberada, 'partos' | 'ultimoParto' | 'nascidos'>,
): string {
  if (casal.partos === 0) return 'Nenhum parto'

  const ate =
    casal.ultimoParto !== null && casal.ultimoParto !== casal.partos
      ? ` (até o ${casal.ultimoParto}º)`
      : ''
  return `${contar(casal.partos, 'parto', 'partos')}${ate}, ${contar(casal.nascidos, 'nascido', 'nascidos')}`
}

/** "+ 1 casal antes" / "+ 2 casais antes": os outros casais da caixa, além do mais recente */
export function casaisAntes(caixa: Pick<CaixaLiberada, 'casais'>): string | null {
  const antes = caixa.casais.length - 1
  return antes > 0 ? `+ ${contar(antes, 'casal', 'casais')} antes` : null
}
