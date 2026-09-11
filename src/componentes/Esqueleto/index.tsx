import { Skeleton } from 'antd'

/**
 * Espera com a forma do que vem.
 *
 * Diferente do `Carregando`: o giro centralizado serve para tela que ainda
 * não tem desenho; o esqueleto serve para **lista e tabela**, onde a forma
 * já é conhecida. Preserva a altura da área e evita o salto de layout que faz
 * o técnico clicar no lugar errado quando o conteúdo chega.
 *
 * ⚠️ Não usar para espera longa e indeterminada. A API na Render dorme e
 * pode levar um minuto para acordar; quem trata isso é o `EstadoDaConsulta`,
 * que depois de alguns segundos troca o carregamento por um aviso explicando
 * que não é erro. Esqueleto pulsando por um minuto parece travamento.
 */
export function Esqueleto({
  linhas = 3,
  comTitulo = false,
}: {
  linhas?: number
  comTitulo?: boolean
}) {
  return <Skeleton active paragraph={{ rows: linhas }} title={comTitulo} />
}
