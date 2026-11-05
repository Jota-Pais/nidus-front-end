// tokens do design system, lado TypeScript: o que o tema do Ant Design lê, mais
// algumas chaves que só o CSS usa e que o tokens.test.ts confere com o tokens.css.
import { frenteLegivel, HOVER, misturar, PRESSIONADO, TOM } from './cor'

/** Marca institucional da UFSC. Vermelho e amarelo ficam de referência para os tons de retorno */
const UFSC = {
  /** PANTONE 355 C · RGB 0,146,6 · Verde Bandeira. */
  verde: '#009206',
  /** PANTONE 2728 C · RGB 0,56,147 · Azul Médio */
  azul: '#003893',
  /** PANTONE 1788 C · RGB 255,0,9 · Vermelho Tomate. Apoio */
  vermelho: '#FF0009',
  /** Pantone Yellow C · RGB 254,227,0 · Amarelo. Apoio. */
  amarelo: '#FEE300',
  /** PANTONE Black C · RGB 0,0,0 · Preto. Apoio. */
  preto: '#000000',
} as const

const BRANCO = '#FFFFFF'
/** Superfície elevada. Branco puro, para o cartão descolar do fundo. Os tons claros vão sobre ele */
const CARTAO = BRANCO

/** A cor de ação. Botão, link, foco, item ativo, seleção: tudo o que se clica sai dela */
const ACAO = UFSC.azul

/** Texto de apoio sobre a marca, como o nome de quem entrou: a cor do texto a 85% */
const TEXTO_DE_APOIO = 0.85

/**
 * Paleta da aplicação. Os estados e os tons claros não são escolhidos à mão: saem da cor
 * pela regra de `./cor`, e o `tokens.css` escreve a mesma conta com `color-mix`.
 */
export const COR = {
  /** Tela. Off-white morno - cansa menos o olho que branco puro num turno */
  fundo: '#FAFAFA',
  /** Texto principal. PANTONE Black C, exato. 20:1 */
  frente: UFSC.preto,
  /** Superfície secundária. Neutro puxado para o azul, para pertencer à paleta */
  suave: '#F1F4F8',
  /** Texto secundário, descrição, metadado. 5.70:1 */
  suaveFrente: '#5A6570',
  /** Borda estrutural */
  borda: '#DCE3EC',
  cartao: CARTAO,

  acao: ACAO,
  acaoFrente: BRANCO,
  acaoHover: misturar(BRANCO, ACAO, HOVER),
  acaoPressionada: misturar(BRANCO, ACAO, PRESSIONADO),
  /** Etiqueta, rótulo de seção, item ativo do menu, aviso de informação */
  acaoFundo: misturar(ACAO, CARTAO, TOM.fundo),
  /** Seleção de texto, item ativo com o mouse em cima */
  acaoFundoHover: misturar(ACAO, CARTAO, TOM.fundoHover),
  /** Contorno dos mesmos, e o halo de foco dos campos */
  acaoBorda: misturar(ACAO, CARTAO, TOM.borda),

  /** Superfície da marca: a metade azul do login e o cabeçalho. É a própria cor de ação */
  marca: ACAO,
  marcaFrente: BRANCO,
  marcaFrenteSuave: misturar(BRANCO, ACAO, TEXTO_DE_APOIO),
  /** Botão sem fundo do cabeçalho, com o mouse em cima */
  marcaHover: misturar(BRANCO, ACAO, HOVER),

  /** Identidade. PANTONE 355 C, exato - a outra cor principal. Não é cor de ação */
  institucional: UFSC.verde,
  /** O mesmo verde com menos luz, para texto e ícone pequeno. 6.06:1 */
  institucionalTexto: '#00700A',
  institucionalFundo: misturar(UFSC.verde, CARTAO, TOM.fundo),
  institucionalBorda: misturar(UFSC.verde, CARTAO, TOM.borda),
} as const

/**
 * cores de retorno ao usuário - as três de apoio da UFSC, escurecidas até
 * passarem em AA como texto. Informação é a própria cor de ação.
 */
export const COR_DE_RETORNO = {
  /** Verde Bandeira escurecido. 6.06:1. */
  sucesso: '#00700A',
  /** amarelo escurecido - como texto. Para fundo, use 'SUPERFICIE_DE_RETORNO.avisoFundo' */
  aviso: '#6F6300',
  /** Vermelho Tomate escurecido. 5.63:1 */
  erro: '#CC0007',
  informacao: ACAO,
} as const

/**
 * Superfície de cada tom de retorno - fundo e contorno. As de sucesso, aviso e erro são
 * escolhidas à mão, e não pela regra dos tons: a cor do texto é a variante escurecida, e 10%
 * de um amarelo escurecido dá bege, não amarelo.
 */
export const SUPERFICIE_DE_RETORNO = {
  sucessoFundo: '#E9F7EB',
  sucessoBorda: '#B6E4BE',
  avisoFundo: '#FFF8DB',
  avisoBorda: '#F5E08A',
  erroFundo: '#FDEBEC',
  erroBorda: '#F5B5B8',
  informacaoFundo: COR.acaoFundo,
  informacaoBorda: COR.acaoBorda,
} as const

/**
 * Superfície de cada coluna do kanban, que a grade de estantes repete. Só a Reserva tem cor
 * própria: as outras usam o tom de retorno, a ação ou o neutro que já diz a mesma coisa.
 */
export const ESTADO = {
  livresFundo: SUPERFICIE_DE_RETORNO.sucessoFundo,
  livresBorda: SUPERFICIE_DE_RETORNO.sucessoBorda,
  livresTexto: COR_DE_RETORNO.sucesso,

  pre_reservaFundo: SUPERFICIE_DE_RETORNO.avisoFundo,
  pre_reservaBorda: SUPERFICIE_DE_RETORNO.avisoBorda,
  pre_reservaTexto: COR_DE_RETORNO.aviso,

  estoqueFundo: COR.acaoFundo,
  estoqueBorda: COR.acaoBorda,
  estoqueTexto: COR.acao,

  reservaFundo: '#FFEEE0',
  reservaBorda: '#F7CBA4',
  reservaTexto: '#8A4300',

  enviadoFundo: COR.suave,
  enviadoBorda: COR.borda,
  enviadoTexto: COR.suaveFrente,
} as const

/**
 * Do 1º ao 5º parto, como na spec do cliente (seção 5.2): não coincidem com as cores das
 * colunas, para a bolinha nunca se confundir com o fundo da caixa. O texto em cima de cada
 * uma é o preto ou o branco, o que contrastar mais, e o fundo é o do cabeçalho da ficha.
 */
export const COR_DO_PARTO = (['#EC4899', '#FACC15', '#22D3EE', '#A3E635', '#6366F1'] as const).map(
  (cor) => ({
    cor,
    frente: frenteLegivel(cor, [COR.frente, BRANCO]),
    fundo: misturar(cor, CARTAO, 0.2),
  }),
)

/** Tipografia de dois tempos */
export const FONTE = {
  titulo: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  interface: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace',
} as const

/** Raio de borda. 'md' é o padrão de controle; lg é o de cartão. */
export const RAIO = {
  sm: 8,
  md: 12,
  lg: 16,
  pilula: 999,
} as const

/** sombras */
export const SOMBRA = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.08)',
} as const

/** Altura de controle: 48px */
export const ALTURA_DE_CONTROLE = 48

/** Corpo de texto em 16px: o design system pede 'base'lg, e Inter aguenta */
export const TAMANHO_DE_FONTE = 16

/** movimento */
export const MOVIMENTO = {
  curva: 'cubic-bezier(0.16, 1, 0.3, 1)',
  rapido: '200ms',
  normal: '300ms',
} as const
