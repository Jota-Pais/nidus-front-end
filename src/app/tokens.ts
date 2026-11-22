// tokens do design system, lado TypeScript: o que o tema do Ant Design lê, mais
// algumas chaves que só o CSS usa e que o tokens.test.ts confere com o tokens.css.
import { HOVER, misturar, PRESSIONADO, TOM } from './cor'

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
 * Superfície de cada fase da caixa, na grade de estantes e na ficha. Fundos claros, cada um de um
 * matiz. Pronto para o estoque repete o sucesso (é a
 * caixa pronta para o próximo passo) e o estoque repete a ação, como antes; o acasalado (lilás) e
 * o mamando (pêssego) têm cor própria.
 */
export const FASE = {
  acasaladoFundo: '#F1EDFB',
  acasaladoBorda: '#D5C8F2',
  acasaladoTexto: '#5B3E9E',

  mamandoFundo: '#FFEEE0',
  mamandoBorda: '#F7CBA4',
  mamandoTexto: '#8A4300',

  prontoEstoqueFundo: SUPERFICIE_DE_RETORNO.sucessoFundo,
  prontoEstoqueBorda: SUPERFICIE_DE_RETORNO.sucessoBorda,
  prontoEstoqueTexto: COR_DE_RETORNO.sucesso,

  estoqueFundo: COR.acaoFundo,
  estoqueBorda: COR.acaoBorda,
  estoqueTexto: COR.acao,

  viuvasFundo: '#E8F4F3',
  viuvasBorda: '#B5DAD6',
  viuvasTexto: '#1F6B63',
} as const

/*
 * Tema escuro. Mesmos nomes e mesmas regras do claro, com fundos escuros, cartão um pouco mais
 * claro que o fundo e texto claro. A marca (o azul do cabeçalho e do login) e as cores dos
 * gráficos não mudam. `tokens.css` escreve os mesmos valores em `:root[data-tema='escuro']`, e
 * `tokens.test.ts` confere.
 */
const CARTAO_ESCURO = '#181D24'
/** Azul claro: o institucional (#003893) some sobre o escuro, então a ação ganha um tom claro, com texto escuro em cima */
const ACAO_ESCURA = '#7AA7FF'
const FRENTE_DA_ACAO_ESCURA = '#08111F'

export const COR_ESCURO: Record<keyof typeof COR, string> = {
  fundo: '#0F1318',
  frente: '#E8ECF1',
  suave: '#1F252D',
  suaveFrente: '#9DA8B4',
  borda: '#2F3742',
  cartao: CARTAO_ESCURO,

  acao: ACAO_ESCURA,
  acaoFrente: FRENTE_DA_ACAO_ESCURA,
  acaoHover: misturar(FRENTE_DA_ACAO_ESCURA, ACAO_ESCURA, HOVER),
  acaoPressionada: misturar(FRENTE_DA_ACAO_ESCURA, ACAO_ESCURA, PRESSIONADO),
  acaoFundo: misturar(ACAO_ESCURA, CARTAO_ESCURO, TOM.fundo),
  acaoFundoHover: misturar(ACAO_ESCURA, CARTAO_ESCURO, TOM.fundoHover),
  acaoBorda: misturar(ACAO_ESCURA, CARTAO_ESCURO, TOM.borda),

  marca: ACAO,
  marcaFrente: BRANCO,
  marcaFrenteSuave: misturar(BRANCO, ACAO, TEXTO_DE_APOIO),
  marcaHover: misturar(BRANCO, ACAO, HOVER),

  institucional: UFSC.verde,
  institucionalTexto: '#5BD16E',
  institucionalFundo: misturar(UFSC.verde, CARTAO_ESCURO, TOM.fundo),
  institucionalBorda: misturar(UFSC.verde, CARTAO_ESCURO, TOM.borda),
}

export const COR_DE_RETORNO_ESCURO: Record<keyof typeof COR_DE_RETORNO, string> = {
  sucesso: '#5BD16E',
  aviso: '#E8C547',
  erro: '#FF7A80',
  informacao: ACAO_ESCURA,
}

export const SUPERFICIE_DE_RETORNO_ESCURO: Record<keyof typeof SUPERFICIE_DE_RETORNO, string> = {
  sucessoFundo: '#12281A',
  sucessoBorda: '#1F4A2E',
  avisoFundo: '#2B2410',
  avisoBorda: '#5A4A12',
  erroFundo: '#2E1517',
  erroBorda: '#6B2A2D',
  informacaoFundo: COR_ESCURO.acaoFundo,
  informacaoBorda: COR_ESCURO.acaoBorda,
}

export const FASE_ESCURO: Record<keyof typeof FASE, string> = {
  acasaladoFundo: '#231D36',
  acasaladoBorda: '#43396B',
  acasaladoTexto: '#C9BAF7',

  mamandoFundo: '#33220F',
  mamandoBorda: '#6B4520',
  mamandoTexto: '#F5B67A',

  prontoEstoqueFundo: SUPERFICIE_DE_RETORNO_ESCURO.sucessoFundo,
  prontoEstoqueBorda: SUPERFICIE_DE_RETORNO_ESCURO.sucessoBorda,
  prontoEstoqueTexto: COR_DE_RETORNO_ESCURO.sucesso,

  estoqueFundo: COR_ESCURO.acaoFundo,
  estoqueBorda: COR_ESCURO.acaoBorda,
  estoqueTexto: COR_ESCURO.acao,

  viuvasFundo: '#112B29',
  viuvasBorda: '#25524E',
  viuvasTexto: '#8FD6CD',
}

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
  /** A barra de telas do celular, que sobe da borda de baixo */
  barra: '0 -2px 8px rgba(0, 0, 0, 0.04)',
} as const

/** As mesmas sombras no tema escuro: mais densas, para ainda aparecerem sobre o fundo escuro */
export const SOMBRA_ESCURO: Record<keyof typeof SOMBRA, string> = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px rgba(0, 0, 0, 0.45)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  barra: '0 -2px 8px rgba(0, 0, 0, 0.4)',
}

/**
 * Cores dos gráficos da Visão geral, com significado fixo: livres verde, reservados azul,
 * machos ciano, fêmeas roxo. Iguais nos dois temas
 */
export const GRAFICO = {
  livres: '#22C55E',
  reservados: '#3B82F6',
  machos: '#06B6D4',
  femeas: '#A855F7',
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
