import { Grid } from 'antd'

/**
 * A tela do celular: abaixo do breakpoint `md` do antd (768 px). É onde a casca troca o menu
 * lateral pela barra embaixo, o tema aumenta o que se toca e a janela vira tela cheia. Do `md`
 * para cima tudo fica como no computador.
 *
 * No primeiro render o antd ainda não mediu a tela e devolve tudo vazio: aí conta como
 * computador, e a medida chega antes de a tela ser pintada (o antd mede num layout effect), sem
 * piscar. Numa tela de verdade abaixo do `md`, o `xs` ou o `sm` está ligado; sem nenhum dos dois
 * (o jsdom dos testes, que não mede nada) também conta como computador
 */
export function useTelaEstreita(): boolean {
  const telas = Grid.useBreakpoint()
  return telas.md === false && (telas.xs === true || telas.sm === true)
}
