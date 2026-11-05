// A regra da paleta: como uma cor gera os estados e os tons claros dela. Os tokens aplicam a
// regra à cor de ação e à institucional, e o tema do Ant Design recebe o resultado, em vez de
// derivar os tons com a conta dele. Mudou a cor de ação, tudo o que sai dela acompanha.

/**
 * Camada de estado do Material 3: quanto da cor de cima (a do texto) vai sobre a cor ao passar
 * o mouse e ao clicar. Serve para qualquer cor, clara ou escura: numa escura, escurecer não
 * daria diferença que se visse.
 */
export const HOVER = 0.08
export const PRESSIONADO = 0.12

/**
 * Tons claros de uma cor sobre o cartão: o fundo de quem leva a cor (etiqueta, item ativo,
 * aviso), esse fundo com o mouse em cima e o contorno.
 */
export const TOM = { fundo: 0.1, fundoHover: 0.16, borda: 0.3 } as const

function canais(cor: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(cor)?.[1]
  if (!hex) throw new Error(`cor fora do formato #RRGGBB: ${cor}`)
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

/** `peso` de `cima` sobre `baixo`, em sRGB: a mesma conta do `color-mix(in srgb, ...)` */
export function misturar(cima: string, baixo: string, peso: number): string {
  const b = canais(baixo)
  const canal = (v: number, i: number) =>
    Math.round(v * peso + b[i]! * (1 - peso))
      .toString(16)
      .padStart(2, '0')
  return `#${canais(cima).map(canal).join('')}`.toUpperCase()
}

/** A cor com transparência, no formato que sombra e `rgba` esperam */
export function transparente(cor: string, alfa: number): string {
  return `rgba(${canais(cor).join(', ')}, ${alfa})`
}

/** Luminância relativa da WCAG 2 */
function luminancia(cor: string): number {
  const [r, g, b] = canais(cor).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste da WCAG 2, de 1 a 21 */
export function contraste(a: string, b: string): number {
  const [clara, escura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (clara + 0.05) / (escura + 0.05)
}

/** Das cores de texto possíveis, a que mais contrasta com o fundo */
export function frenteLegivel(fundo: string, opcoes: readonly string[]): string {
  return opcoes.reduce((melhor, cor) =>
    contraste(cor, fundo) > contraste(melhor, fundo) ? cor : melhor,
  )
}
