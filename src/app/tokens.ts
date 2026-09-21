// tokens do design system - fonte única, lado TypeScript.

/** Marca institucional da UFSC */
export const UFSC = {
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

/** Paleta da aplicação */
export const COR = {
  /** Tela. Off-white morno - cansa menos o olho que branco puro num turno */
  fundo: '#FAFAFA',
  /** Texto principal. PANTONE Black C, exato. 20:1 */
  frente: UFSC.preto,
  /** Fundo da faixa invertida: o azul institucional no escuro, não um cinza qualquer */
  invertido: '#001B47',
  /** Superfície secundária. Neutro puxado para o azul, para pertencer à paleta */
  suave: '#F1F4F8',
  /** Texto secundário, descrição, metadado. 5.70:1 */
  suaveFrente: '#5A6570',

  /** Ação. Botão, link, foco, seleção. */
  acento: UFSC.azul,
  /** Segundo passo do gradiente do botão. Branco em cima ainda dá 5.80:1. */
  acentoSecundario: '#0B5FD6',
  acentoFrente: '#FFFFFF',

  /** Identidade. PANTONE 355 C, exato - a outra cor principal */
  institucional: UFSC.verde,
  /** O mesmo verde com menos luz, para texto e ícone pequeno. 6.06:1 */
  institucionalTexto: '#00700A',

  /** Borda estrutural */
  borda: '#DCE3EC',
  /** Superfície elevada. Branco puro, para o cartão descolar do fundo */
  cartao: '#FFFFFF',
} as const

/**
 * cores de retorno ao usuário - as três de apoio da UFSC, escurecidas até
 * passarem em AA como texto.
 */
export const COR_DE_RETORNO = {
  /** Verde Bandeira escurecido. 6.06:1. */
  sucesso: '#00700A',
  /** amarelo escurecido - como texto. Para preenchimento, use 'UFSC.amarelo' */
  aviso: '#6F6300',
  /** Vermelho Tomate escurecido. 5.63:1 */
  erro: '#CC0007',
  informacao: UFSC.azul,
} as const

/** Superfície de cada tom de retorno - fundo e contorno */
export const SUPERFICIE_DE_RETORNO = {
  sucessoFundo: '#E9F7EB',
  sucessoBorda: '#B6E4BE',
  avisoFundo: '#FFF8DB',
  avisoBorda: '#F5E08A',
  erroFundo: '#FDEBEC',
  erroBorda: '#F5B5B8',
  informacaoFundo: '#E4EDFA',
  informacaoBorda: '#AFC8EC',
} as const

/** Os dois gradientes e a razão de serem dois */
export const GRADIENTE = {
  marca: `linear-gradient(135deg, ${UFSC.verde}, ${UFSC.azul})`,
  acento: `linear-gradient(135deg, ${COR.acento}, ${COR.acentoSecundario})`,
  acentoHorizontal: `linear-gradient(to right, ${COR.acento}, ${COR.acentoSecundario})`,
} as const

/** Tipografia de dois tempos */
export const FONTE = {
  titulo: '"Calistoga", Georgia, "Times New Roman", serif',
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
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  acento: '0 4px 14px rgba(0, 56, 147, 0.25)',
  acentoForte: '0 8px 24px rgba(0, 56, 147, 0.35)',
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
  entrada: '700ms',
} as const

/** Superfície de cada estado de comprometimento da caixa. */
export const ESTADO = {
  em_reproducao: { fundo: '#E9F7EB', borda: '#B6E4BE', texto: '#00600A' },
  parcialmente_comprometida: { fundo: '#FFF8DB', borda: '#F5E08A', texto: '#6F5B00' },
  totalmente_comprometida: { fundo: '#FFEEE0', borda: '#F7CBA4', texto: '#8A4300' },
  preparada_para_envio: { fundo: '#E4EDFA', borda: '#AFC8EC', texto: '#003893' },
  expedida: { fundo: '#F2F4F7', borda: '#DCE3EC', texto: '#5A6570' },
} as const
