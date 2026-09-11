/**
 * Tokens do design system — fonte única, lado TypeScript.
 *
 * O design system do projeto ("Minimalist Modern") descreve os tokens em
 * Tailwind. Aqui não há Tailwind: há Ant Design. Então os valores moram neste
 * arquivo uma vez e saem por dois canos:
 *
 * - `tokens.css`, como custom properties, para o CSS dos componentes;
 * - `tema.ts`, como `ThemeConfig`, para o Ant Design.
 *
 * Os dois têm que concordar, e `tokens.test.ts` falha se divergirem — token
 * duplicado que sai de sincronia é como uma tela fica com a cor de ontem.
 *
 * ⚠️ **Não escrever cor, raio, sombra ou fonte literal em componente.** Se o
 * valor não está aqui, ele não é do design system.
 *
 * As regras de uso da paleta estão em `src/componentes/README.md`.
 */

/**
 * Marca institucional da UFSC.
 *
 * Valores exatos do manual — são especificação de **vinil adesivo**, e é por
 * isso que estão aqui separados do resto: são a referência, não
 * necessariamente o que vai na tela. Cor de sinalização e cor de texto em
 * monitor são coisas diferentes, e `tokens.test.ts` cobra a diferença.
 *
 * ⚠️ **Verde e azul são as principais. Vermelho, amarelo e preto são apoio** —
 * entram para dizer erro, atenção e contorno, nunca para decorar.
 */
export const UFSC = {
  /** PANTONE 355 C · RGB 0,146,6 · Verde Bandeira. */
  verde: '#009206',
  /** PANTONE 2728 C · RGB 0,56,147 · Azul Médio. */
  azul: '#003893',
  /** PANTONE 1788 C · RGB 255,0,9 · Vermelho Tomate. Apoio. */
  vermelho: '#FF0009',
  /** Pantone Yellow C · RGB 254,227,0 · Amarelo. Apoio. */
  amarelo: '#FEE300',
  /** PANTONE Black C · RGB 0,0,0 · Preto. Apoio. */
  preto: '#000000',
} as const

/**
 * Paleta da aplicação.
 *
 * ⚠️ **Por que nem toda cor daqui é o hex cru da UFSC.**
 *
 * A paleta institucional é de vinil, e três das cinco não alcançam o contraste
 * de 4.5:1 que o `RNF-10` exige para texto:
 *
 * | Cor | Como texto sobre a tela | Com branco por cima |
 * |---|---|---|
 * | Azul Médio | **10.13** ✅ | **10.57** ✅ |
 * | Preto | **20.12** ✅ | — |
 * | Verde Bandeira | 3.93 ❌ | 4.11 ❌ |
 * | Vermelho Tomate | 3.83 ❌ | 4.00 ❌ |
 * | Amarelo | 1.24 ❌ | 1.30 ❌ |
 *
 * Então a regra é: **o hex institucional vale onde não há texto pequeno** —
 * preenchimento, marca, barra, ícone grande, onde 3:1 basta. Onde há texto,
 * entra a variante escurecida, que é a mesma cor com menos luz. Ninguém
 * percebe a diferença de tom; todo mundo percebe a diferença de leitura.
 *
 * O azul é o único que serve aos dois usos sem mudar nada, e é por isso que é
 * ele quem carrega ação.
 */
export const COR = {
  /** Tela. Off-white morno — cansa menos o olho que branco puro num turno. */
  fundo: '#FAFAFA',
  /** Texto principal. PANTONE Black C, exato. 20:1. */
  frente: UFSC.preto,
  /** Fundo da faixa invertida: o azul institucional no escuro, não um cinza qualquer. */
  invertido: '#001B47',
  /** Superfície secundária. Neutro puxado para o azul, para pertencer à paleta. */
  suave: '#F1F4F8',
  /** Texto secundário, descrição, metadado. 5.70:1. */
  suaveFrente: '#5A6570',

  /**
   * **Ação.** Botão, link, foco, seleção. PANTONE 2728 C, exato.
   *
   * O azul é quem manda porque é o único institucional que passa AA como
   * texto **e** como fundo de botão. Ação é o lugar onde não se pode
   * negociar contraste.
   */
  acento: UFSC.azul,
  /** Segundo passo do gradiente do botão. Branco em cima ainda dá 5.80:1. */
  acentoSecundario: '#0B5FD6',
  acentoFrente: '#FFFFFF',

  /**
   * **Identidade.** PANTONE 355 C, exato — a outra cor principal.
   *
   * ⚠️ Preenchimento e marca, **nunca texto pequeno nem fundo de botão**:
   * 4.11:1 com branco em cima reprova em AA. Para texto, `institucionalTexto`.
   */
  institucional: UFSC.verde,
  /** O mesmo verde com menos luz, para texto e ícone pequeno. 6.06:1. */
  institucionalTexto: '#00700A',

  /** Borda estrutural. */
  borda: '#DCE3EC',
  /** Superfície elevada. Branco puro, para o cartão descolar do fundo. */
  cartao: '#FFFFFF',
} as const

/**
 * Cores de retorno ao usuário — **as três de apoio da UFSC**, escurecidas até
 * passarem em AA como texto.
 *
 * `sucesso` é o verde institucional, `erro` é o Vermelho Tomate e `aviso` é o
 * Amarelo. Nenhuma cor inventada: são as do manual com a luz baixada até
 * 4.5:1. O padrão do Ant Design (`#52c41a`, `#faad14`, `#ff4d4f`) destoaria
 * da instituição e foi descartado.
 */
export const COR_DE_RETORNO = {
  /** Verde Bandeira escurecido. 6.06:1. */
  sucesso: '#00700A',
  /** Amarelo escurecido — como texto. Para preenchimento, use `UFSC.amarelo`. */
  aviso: '#6F6300',
  /** Vermelho Tomate escurecido. 5.63:1. */
  erro: '#CC0007',
  informacao: UFSC.azul,
} as const

/**
 * Superfície de cada tom de retorno — fundo e contorno.
 *
 * ⚠️ **Existe porque a cor de texto não serve de fundo.** `COR_DE_RETORNO` é
 * a cor **escurecida**, a que passa em AA como texto; o Ant Design, se
 * deixado sozinho, deriva o fundo do `Alert` a partir dela e o amarelo
 * institucional escurecido vira um fundo cor de oliva. Aqui o par é
 * explícito: superfície clara da cor original, texto escuro por cima.
 *
 * Os valores coincidem de propósito com as superfícies de estado da caixa que
 * usam a mesma cor — um amarelo claro só no sistema inteiro.
 */
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

/**
 * Os dois gradientes, e a razão de serem dois.
 *
 * - **`marca`** é a assinatura: verde → azul, as duas principais da UFSC numa
 *   varredura só. É o que dá identidade imediata ao sistema. ⚠️ Só em
 *   superfície **sem texto pequeno em cima** — a ponta verde entrega 4.11:1
 *   com branco, que serve para elemento gráfico (3:1) e não para texto.
 * - **`acento`** é o de trabalho: azul → azul mais claro, garantindo branco
 *   legível do começo ao fim da varredura. É o do botão primário.
 *
 * Ter um só seria escolher entre identidade e legibilidade. São dois porque
 * os dois usos são diferentes.
 */
export const GRADIENTE = {
  marca: `linear-gradient(135deg, ${UFSC.verde}, ${UFSC.azul})`,
  acento: `linear-gradient(135deg, ${COR.acento}, ${COR.acentoSecundario})`,
  acentoHorizontal: `linear-gradient(to right, ${COR.acento}, ${COR.acentoSecundario})`,
} as const

/**
 * Tipografia de dois tempos.
 *
 * `Calistoga` é a voz da personalidade: serifa morna, só em título de tela e
 * de seção. `Inter` é a voz da clareza: todo o resto. `JetBrains Mono` marca
 * rótulo de seção, código de posição e qualquer número que precise alinhar em
 * coluna.
 *
 * ⚠️ O código de endereço da caixa (`A1`, `C3`) é **sempre** monoespaçado com
 * `font-variant-numeric: tabular-nums`: é o dado que o técnico compara
 * varrendo a grade com o olho, e fonte proporcional desalinha a coluna.
 */
export const FONTE = {
  titulo: '"Calistoga", Georgia, "Times New Roman", serif',
  interface: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace',
} as const

/** Raio de borda. `md` é o padrão de controle; `lg` é o de cartão. */
export const RAIO = {
  sm: 8,
  md: 12,
  lg: 16,
  pilula: 999,
} as const

/**
 * Sombras.
 *
 * As de acento (`acento`, `acentoForte`) são tingidas do azul institucional e
 * existem só para elemento de ação: é o que dá a sensação de que o botão
 * primário está mais alto que o resto da tela.
 */
export const SOMBRA = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.08)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  acento: '0 4px 14px rgba(0, 56, 147, 0.25)',
  acentoForte: '0 8px 24px rgba(0, 56, 147, 0.35)',
} as const

/**
 * Altura de controle: **48px**.
 *
 * Os dois lados pedem o mesmo número, por motivos diferentes, e é raro:
 *
 * - o design system pede `h-12`–`h-14` e alvo de toque de 44px+;
 * - o `RNF-03` diz que o registro acontece **dentro da sala, com o técnico de
 *   luvas e paramentado**, em tela pequena.
 *
 * O padrão do Ant Design é 32px. O projeto estava em 40; 48 atende aos dois.
 */
export const ALTURA_DE_CONTROLE = 48

/** Corpo de texto em 16px: o design system pede `base`→`lg`, e Inter aguenta. */
export const TAMANHO_DE_FONTE = 16

/**
 * Movimento.
 *
 * A curva é a do design system (`[0.16, 1, 0.3, 1]`): sai rápido e assenta
 * devagar, que é o que faz a transição parecer natural em vez de mecânica.
 *
 * ⚠️ Toda animação contínua tem que morrer em `prefers-reduced-motion` — ver
 * `tokens.css`. Não é opcional: movimento perpétuo em tela de trabalho é
 * gatilho de enjoo para quem tem sensibilidade vestibular.
 */
export const MOVIMENTO = {
  curva: 'cubic-bezier(0.16, 1, 0.3, 1)',
  rapido: '200ms',
  normal: '300ms',
  entrada: '700ms',
} as const

/**
 * Superfície de cada estado de comprometimento da caixa.
 *
 * Todas saem das cinco cores da UFSC, em versão muito clara: verde para a
 * caixa que reproduz, amarelo para a parcialmente comprometida, âmbar para a
 * totalmente, azul para a preparada e neutro para a expedida. A ordem das
 * cores acompanha a ordem das colunas, então o quadro tem progressão visual.
 *
 * ⚠️ **A cor é o quarto canal, não o primeiro.** `RNF-10`: cada estado carrega
 * marcador (forma) e sigla, definidos em `@/dominio/estados`, mais a coluna em
 * que está. Em preto e branco esta tabela some e o card continua legível.
 *
 * ⚠️ **Superfície clara, de propósito.** O acento é azul saturado e escuro; se
 * um estado fosse pintado com a mesma força, disputaria o olho com o botão e
 * o usuário clicaria na caixa achando que é comando. Cada `texto` foi
 * escolhido para passar AA sobre o seu próprio `fundo` — o teste cobra.
 */
export const ESTADO = {
  em_reproducao: { fundo: '#E9F7EB', borda: '#B6E4BE', texto: '#00600A' },
  parcialmente_comprometida: { fundo: '#FFF8DB', borda: '#F5E08A', texto: '#6F5B00' },
  totalmente_comprometida: { fundo: '#FFEEE0', borda: '#F7CBA4', texto: '#8A4300' },
  preparada_para_envio: { fundo: '#E4EDFA', borda: '#AFC8EC', texto: '#003893' },
  expedida: { fundo: '#F2F4F7', borda: '#DCE3EC', texto: '#5A6570' },
} as const
