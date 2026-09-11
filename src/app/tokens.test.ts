import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
  ESTADO,
  FONTE,
  GRADIENTE,
  MOVIMENTO,
  RAIO,
  SOMBRA,
  TAMANHO_DE_FONTE,
  UFSC,
} from './tokens'

/**
 * O mesmo token mora em dois arquivos — `tokens.ts` para o Ant Design,
 * `tokens.css` para o CSS dos componentes. Este teste é o que impede os dois
 * de sair de sincronia, que é como uma tela acaba com a cor da semana passada
 * enquanto a do lado já mudou.
 *
 * E, principalmente, é onde o `RNF-10` deixa de ser intenção e vira número: a
 * paleta da UFSC é especificação de **vinil adesivo**, e três das cinco cores
 * não alcançam o contraste de texto em tela. Cada valor derivado daqui existe
 * por causa de uma dessas contas, e a conta está aqui embaixo.
 */

/*
 * O CSS é lido do disco, e o caminho é relativo à raiz do projeto — que é
 * onde o Vitest roda.
 *
 * Não dá para usar `import './tokens.css?raw'`: a configuração de teste tem
 * `css: false`, então o Vitest não processa CSS e o import volta vazio. E não
 * dá para usar `new URL('./tokens.css', import.meta.url)`: em jsdom o
 * `import.meta.url` é `http:`, não `file:`.
 */
const css = readFileSync('src/app/tokens.css', 'utf8')

function variaveis(): Map<string, string> {
  const mapa = new Map<string, string>()
  // Sem âncora de linha: o arquivo pode estar com CRLF, e aí `$` não casa
  // logo depois do `;`.
  for (const [, nome, valor] of css.matchAll(/(--[a-z0-9-_]+):\s*([^;]+);/g)) {
    if (nome && valor) mapa.set(nome, valor.trim())
  }
  return mapa
}

function kebab(nome: string): string {
  return nome.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** O que `tokens.ts` afirma que `tokens.css` tem que dizer. */
function esperado(): Map<string, string> {
  const mapa = new Map<string, string>()
  const por = (prefixo: string, objeto: Record<string, string | number>, unidade = '') => {
    for (const [chave, valor] of Object.entries(objeto)) {
      mapa.set(`--${prefixo}-${kebab(chave)}`, `${valor}${typeof valor === 'number' ? unidade : ''}`)
    }
  }

  por('ufsc', UFSC)
  por('cor', COR)
  por('cor', COR_DE_RETORNO)
  por('gradiente', GRADIENTE)
  por('fonte', FONTE)
  por('raio', RAIO, 'px')
  por('sombra', SOMBRA)
  por('movimento', MOVIMENTO)

  mapa.set('--altura-de-controle', `${ALTURA_DE_CONTROLE}px`)
  mapa.set('--tamanho-de-fonte', `${TAMANHO_DE_FONTE}px`)

  for (const [estado, superficie] of Object.entries(ESTADO)) {
    for (const [parte, valor] of Object.entries(superficie)) {
      // O nome do estado é a chave do contrato (`em_reproducao`) e fica como
      // está: virar kebab aqui desalinharia da classe CSS do card.
      mapa.set(`--estado-${estado}-${parte}`, valor)
    }
  }

  return mapa
}

/* -- Contraste, pela fórmula da WCAG 2.1 --------------------------------- */

function canal(valor: number): number {
  const c = valor / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminancia(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255)
}

export function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (claro + 0.05) / (escuro + 0.05)
}

/** Texto normal em AA. O piso do `RNF-10` para tudo que se lê. */
const AA_TEXTO = 4.5
/** Elemento gráfico e texto grande. Serve para marca e preenchimento. */
const AA_GRAFICO = 3

describe('tokens.ts e tokens.css dizem a mesma coisa', () => {
  it('toda constante do TypeScript existe no CSS, com o mesmo valor', () => {
    const doCss = variaveis()
    for (const [nome, valor] of esperado()) {
      expect(doCss.get(nome), `variável ${nome} ausente ou diferente em tokens.css`).toBe(valor)
    }
  })

  it('o CSS não declara token que o TypeScript desconhece', () => {
    const declarados = esperado()
    const sobrando = [...variaveis().keys()].filter((nome) => !declarados.has(nome))
    expect(sobrando, 'token só no CSS: ou some, ou entra em tokens.ts').toEqual([])
  })
})

describe('marca institucional — os hex do manual não podem ser "arredondados"', () => {
  it('são os cinco valores do manual da UFSC, exatos', () => {
    expect(UFSC).toEqual({
      verde: '#009206',
      azul: '#003893',
      vermelho: '#FF0009',
      amarelo: '#FEE300',
      preto: '#000000',
    })
  })

  /** Verde e azul são as principais; o resto é apoio. */
  it('as duas principais são as que a aplicação usa como acento e identidade', () => {
    expect(COR.acento).toBe(UFSC.azul)
    expect(COR.institucional).toBe(UFSC.verde)
  })

  it('o gradiente-assinatura é verde → azul, as duas principais juntas', () => {
    expect(GRADIENTE.marca).toContain(UFSC.verde)
    expect(GRADIENTE.marca).toContain(UFSC.azul)
  })
})

describe('RNF-10 — contraste, onde a paleta de vinil não serve para tela', () => {
  /**
   * O diagnóstico que justifica cada variante escurecida deste arquivo.
   * Se um dia a UFSC publicar outros hex, este teste é o primeiro a avisar
   * que a conta mudou.
   */
  it('só o azul e o preto do manual passam em AA como texto', () => {
    expect(contraste(UFSC.azul, COR.fundo)).toBeGreaterThanOrEqual(AA_TEXTO)
    expect(contraste(UFSC.preto, COR.fundo)).toBeGreaterThanOrEqual(AA_TEXTO)

    expect(contraste(UFSC.verde, COR.fundo)).toBeLessThan(AA_TEXTO)
    expect(contraste(UFSC.vermelho, COR.fundo)).toBeLessThan(AA_TEXTO)
    expect(contraste(UFSC.amarelo, COR.fundo)).toBeLessThan(AA_TEXTO)
  })

  it('toda cor que vira texto passa em AA sobre o fundo da aplicação', () => {
    const textos = {
      frente: COR.frente,
      suaveFrente: COR.suaveFrente,
      acento: COR.acento,
      institucionalTexto: COR.institucionalTexto,
      ...COR_DE_RETORNO,
    }

    for (const [nome, cor] of Object.entries(textos)) {
      expect(contraste(cor, COR.fundo), `${nome} (${cor}) como texto`).toBeGreaterThanOrEqual(
        AA_TEXTO,
      )
    }
  })

  it('o branco é legível nas duas pontas do gradiente do botão', () => {
    expect(contraste(COR.acentoFrente, COR.acento)).toBeGreaterThanOrEqual(AA_TEXTO)
    expect(contraste(COR.acentoFrente, COR.acentoSecundario)).toBeGreaterThanOrEqual(AA_TEXTO)
  })

  /**
   * ⚠️ É por isso que existem **dois** gradientes. A ponta verde do
   * `marca` serve a elemento gráfico e a título grande, não a texto de
   * interface — e é o teste que impede alguém de usar `marca` num botão.
   */
  it('o verde institucional serve como marca, e não como fundo de texto', () => {
    const brancoSobreVerde = contraste(COR.acentoFrente, COR.institucional)
    expect(brancoSobreVerde).toBeGreaterThanOrEqual(AA_GRAFICO)
    expect(brancoSobreVerde).toBeLessThan(AA_TEXTO)
  })

  it('a faixa invertida é legível com texto branco', () => {
    expect(contraste('#FFFFFF', COR.invertido)).toBeGreaterThanOrEqual(AA_TEXTO)
  })
})

describe('estado da caixa — RF-CIC-01 e RNF-10', () => {
  it('o texto de cada estado passa em AA sobre a própria superfície', () => {
    for (const [estado, superficie] of Object.entries(ESTADO)) {
      expect(
        contraste(superficie.texto, superficie.fundo),
        `${estado}: ${superficie.texto} sobre ${superficie.fundo}`,
      ).toBeGreaterThanOrEqual(AA_TEXTO)
    }
  })

  it('as cinco superfícies são distintas entre si', () => {
    const fundos = Object.values(ESTADO).map((s) => s.fundo)
    expect(new Set(fundos).size).toBe(fundos.length)
  })

  /**
   * O acento é a cor da ação. Um estado pintado com a mesma força faria o
   * usuário clicar na caixa achando que é botão — por isso as superfícies
   * são claras, e nenhuma é o acento.
   */
  it('nenhuma superfície de estado é a cor de ação', () => {
    const superficies = Object.values(ESTADO).flatMap((s) => [s.fundo, s.borda])
    expect(superficies).not.toContain(COR.acento)
    expect(superficies).not.toContain(COR.acentoSecundario)
  })
})

describe('o design system, onde ele é requisito e não gosto', () => {
  /**
   * `RNF-03` — registro dentro da sala, técnico de luvas. O design system
   * pede 44px+ de alvo de toque pelo mesmo motivo, vindo de outro lado.
   */
  it('o controle tem alvo de toque de pelo menos 44px', () => {
    expect(ALTURA_DE_CONTROLE).toBeGreaterThanOrEqual(44)
  })
})
