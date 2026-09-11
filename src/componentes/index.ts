/**
 * Biblioteca de componentes do Nidus.
 *
 * Um import por tela:
 *
 * ```tsx
 * import { CabecalhoDaTela, Pilha, Secao, Tabela } from '@/componentes'
 * ```
 *
 * O que entra aqui: componente usado por **mais de uma tela**, ou que carrega
 * uma decisão que não pode variar de tela para tela — formato de data
 * (`RNF-04`), codificação de estado (`RNF-10`), alvo de toque (`RNF-03`),
 * conversão de `Dayjs` para `DataISO`.
 *
 * O que **não** entra: componente de uma tela só. Esse mora ao lado da tela,
 * como `CardDaPosicao` mora em `telas/estantes/`.
 *
 * Ver `README.md` nesta pasta.
 */

/* -- Fundação do design system ------------------------------------------- */
export { Botao } from './Botao'
export type { VarianteDeBotao } from './Botao'
export { Cartao } from './Cartao'
export type { VarianteDeCartao } from './Cartao'
export { IconeEmCaixa } from './IconeEmCaixa'
export { Pilha } from './Pilha'
export { PontoPulsante } from './PontoPulsante'
export { Revelar } from './Revelar'
export { RotuloDeSecao } from './RotuloDeSecao'
export { SecaoInvertida } from './SecaoInvertida'
export { TextoGradiente } from './TextoGradiente'

/* -- Casca e estrutura de tela ------------------------------------------- */
export { BarraDeFiltros } from './BarraDeFiltros'
export { BotaoDeConfirmacao } from './BotaoDeConfirmacao'
export { CabecalhoDaTela } from './CabecalhoDaTela'
export { CampoDeFiltro } from './CampoDeFiltro'
export { LinhaDoTempo } from './LinhaDoTempo'
export { ListaDeDefinicoes } from './ListaDeDefinicoes'
export type { Definicao } from './ListaDeDefinicoes'
export { MensagemDeErro } from './MensagemDeErro'
export { ModalDeFormulario } from './ModalDeFormulario'
export { PainelDeIndicadores } from './PainelDeIndicadores'
export type { Indicador } from './PainelDeIndicadores'
export { Secao } from './Secao'
export { Tabela } from './Tabela'
export { Vazio } from './Vazio'

/* -- Campos de formulário ------------------------------------------------ */
export { CampoDeData } from './CampoDeData'
export { CampoDePeriodo } from './CampoDePeriodo'
export type { Periodo } from './CampoDePeriodo'
export { CampoDeProjetoEtica } from './CampoDeProjetoEtica'
export {
  DIGITOS_DO_PROJETO,
  estaCompleto as projetoEstaCompleto,
  formatarProjeto,
  somenteDigitos,
} from './CampoDeProjetoEtica/mascara'
export { CampoPorSexo } from './CampoPorSexo'
export {
  estaCompleto as porSexoEstaCompleto,
  paraPorSexo,
  total as totalPorSexo,
  VAZIO as POR_SEXO_VAZIO,
} from './CampoPorSexo/valor'
export type { ValorPorSexo } from './CampoPorSexo/valor'
export { SeletorDeEspecie } from './SeletorDeEspecie'
export { SeletorDeEstante } from './SeletorDeEstante'
export { SeletorDeLinhagem } from './SeletorDeLinhagem'
export { SeletorDeParGenetico } from './SeletorDeParGenetico'
export { SeletorDeSala } from './SeletorDeSala'

/* -- Exibição de domínio ------------------------------------------------- */
export { Data } from './Data'
export { DataPrevistaOuReal } from './DataPrevistaOuReal'
export { Endereco } from './Endereco'
export { Idade } from './Idade'
export { IndicadorDeCiclo } from './IndicadorDeCiclo'
export { MarcaDeAtraso } from './MarcaDeAtraso'
export { ProximoEvento } from './ProximoEvento'
export { QuantidadePorSexo } from './QuantidadePorSexo'
export { TagDeEspecie } from './TagDeEspecie'
export { TagDeFinalidade } from './TagDeFinalidade'
export { TagDePerfil } from './TagDePerfil'

/* -- Quadro de comprometimento ------------------------------------------- */
export { BotaoDeMoverEstado } from './BotaoDeMoverEstado'
export { CardDaCaixa } from './CardDaCaixa'
export { ColunaDoQuadro } from './ColunaDoQuadro'
export { DialogoDeExcecao } from './DialogoDeExcecao'

/*
 * Reexportados de onde já moravam.
 *
 * `Legenda` e as marcas ficam em `@/dominio` porque o `contrato-api.md` §1.1
 * aponta para lá e diz que **os valores daqueles arquivos são o contrato**.
 * Mover quebraria o apontamento; reexportar dá o import único sem mexer na
 * fonte. O mesmo vale para `EstadoDaConsulta` e `Carregando`, que são da
 * casca (`@/layout`) e continuam sendo.
 */
export { Carregando } from '@/layout/Carregando'
export { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
export { Legenda, MarcaEstadoCaixa, MarcaGrauCerteza } from '@/dominio/Legenda'
