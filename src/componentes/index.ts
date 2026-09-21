// Biblioteca de componentes do Nidus

/** -- Elementos de base, sobre o Ant Design -------------------------------- */
export { Abas } from './Abas'
export type { Aba } from './Abas'
export { Aviso } from './Aviso'
export type { TomDeAviso } from './Aviso'
export { CaixaDeSelecao } from './CaixaDeSelecao'
export { Colunas } from './Colunas'
export { Dica } from './Dica'
export { Divisor } from './Divisor'
export { Entrada } from './Entrada'
export { EntradaNumero } from './EntradaNumero'
export { Escolha } from './Escolha'
export type { OpcaoDeEscolha } from './Escolha'
export { Esqueleto } from './Esqueleto'
export { Etiqueta } from './Etiqueta'
export type { TomDeEtiqueta } from './Etiqueta'
export { Formulario } from './Formulario'
export { Gaveta } from './Gaveta'
export { Interruptor } from './Interruptor'
export { Linha } from './Linha'
export { Paragrafo } from './Paragrafo'
export { Passos } from './Passos'
export type { Passo } from './Passos'
export { Recolhivel } from './Recolhivel'
export type { Painel } from './Recolhivel'
export { Resultado } from './Resultado'
export type { TipoDeResultado } from './Resultado'
export { Selo } from './Selo'
export { Seletor } from './Seletor'
export { Texto } from './Texto'
export type { TomDeTexto } from './Texto'
export { Titulo } from './Titulo'

/** -- Fundação do design system ------------------------------------------- */
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

/** -- Casca e estrutura de tela ------------------------------------------- */
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

/** -- Campos de formulário ------------------------------------------------ */
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

/** -- Exibição de domínio ------------------------------------------------- */
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

/** -- Quadro de comprometimento ------------------------------------------- */
export { BotaoDeMoverEstado } from './BotaoDeMoverEstado'
export { CardDaCaixa } from './CardDaCaixa'
export { ColunaDoQuadro } from './ColunaDoQuadro'
export { DialogoDeExcecao } from './DialogoDeExcecao'

/** -- Ficha da posição - abre da grade e do quadro, RF-CIC-02 -------------- */
export { FichaDaCaixa } from './FichaDaCaixa'
export { useAbrirFicha } from '@/dominio/useFicha'

/** reexportados de onde já moravam */
export { Carregando } from '@/layout/Carregando'
export { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
export { Legenda, MarcaEstadoCaixa, MarcaGrauCerteza } from '@/dominio/Legenda'
