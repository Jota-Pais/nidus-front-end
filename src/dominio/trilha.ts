// A trilha da caixa de estoque: os animais que chegaram a ela e os que saíram, com de onde vieram e
// para onde foram. A caixa liberada não tem mais vivo, e é a trilha que conta onde eles estão
import { formatarData } from '@/lib/data'
import { descreverQuantos } from './pedido'
import type { OrigemDaPassagem, PassagemDoEstoque, PorSexo } from './tipos'

/** "2 machos e 1 fêmea", "1 fêmea" */
export function descreverAnimais(qtd: PorSexo): string {
  return descreverQuantos({ ...qtd, qualquer: 0 })
}

/** O verbo concorda com os animais: 'chegou' para um, 'chegaram' para mais */
const concordar = (qtd: PorSexo, singular: string, plural: string) =>
  qtd.m + qtd.f === 1 ? singular : plural

/** "F2C (E3)": a caixa com o número da estante, que o código sozinho repete entre estantes */
function daCaixa(caixa: PassagemDoEstoque['outraCaixa']): string {
  return caixa === null ? 'outra caixa' : `${caixa.codigo} (${caixa.numeroVisivel})`
}

/**
 * O que aconteceu, visto da caixa: "Cadastro inicial: 6 machos", "Da caixa F1A (E3): 4 machos",
 * "Para a caixa F2C (E2): 3 machos", "Entregues ao pedido #12: 2 machos", "Morte: 1 macho"
 */
export function descreverPassagem(passagem: PassagemDoEstoque): string {
  const animais = descreverAnimais(passagem)
  const motivo = passagem.motivo ? ` (${passagem.motivo})` : ''

  switch (passagem.tipo) {
    case 'entrada':
      return `Cadastro inicial: ${animais}`
    case 'nascimento':
      return `${concordar(passagem, 'Nasceu', 'Nasceram')} nesta caixa: ${animais}`
    case 'correcao':
      return `Correção do nascimento: ${animais} a mais${motivo}`
    case 'mudanca':
      return passagem.sentido === 'chegada'
        ? `Da caixa ${daCaixa(passagem.outraCaixa)}: ${animais}`
        : `Para a caixa ${daCaixa(passagem.outraCaixa)}: ${animais}`
    case 'anulacao':
      return passagem.sentido === 'chegada'
        ? `Baixa anulada na caixa ${daCaixa(passagem.outraCaixa)}: ${animais} ${concordar(passagem, 'voltou', 'voltaram')} para esta`
        : `Baixa anulada: ${animais} ${concordar(passagem, 'voltou', 'voltaram')} para a caixa ${daCaixa(passagem.outraCaixa)}`
    case 'entrega':
      return `${concordar(passagem, 'Entregue', 'Entregues')} ao pedido #${passagem.idPedido ?? '—'}: ${animais}`
    case 'baixa':
      return `${passagem.causa === 'eutanasia' ? 'Eutanásia' : 'Morte'}: ${animais}${motivo}`
  }
}

/** "2 machos do 2º parto do casal AB, nascidos em 24/09/2026"; o cadastro inicial sem casal */
export function descreverOrigemDaPassagem(origem: OrigemDaPassagem): string {
  const deOnde =
    origem.ordem === null || origem.casal === null
      ? 'do cadastro inicial'
      : `do ${origem.ordem}º parto do casal ${origem.casal}`
  // só fêmeas, no feminino
  const nascido = origem.m === 0 && origem.f > 0 ? 'nascida' : 'nascido'
  const nascidos = origem.dtNascimento
    ? `, ${nascido}${origem.m + origem.f === 1 ? '' : 's'} em ${formatarData(origem.dtNascimento)}`
    : ''

  return `${descreverAnimais(origem)} ${deOnde}${nascidos}`
}

const somar = (soma: PorSexo, qtd: PorSexo): PorSexo => ({ m: soma.m + qtd.m, f: soma.f + qtd.f })

/** A trilha separada em chegadas e saídas, cada uma com o total por sexo, na ordem da API */
export function separarATrilha(trilha: PassagemDoEstoque[]) {
  const chegadas = trilha.filter((passagem) => passagem.sentido === 'chegada')
  const saidas = trilha.filter((passagem) => passagem.sentido === 'saida')

  return {
    chegadas,
    saidas,
    chegaram: chegadas.reduce<PorSexo>(somar, { m: 0, f: 0 }),
    sairam: saidas.reduce<PorSexo>(somar, { m: 0, f: 0 }),
  }
}
