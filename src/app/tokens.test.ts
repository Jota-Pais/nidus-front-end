import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste, misturar } from './cor'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
  COR_DO_PARTO,
  FASE,
  FONTE,
  MOVIMENTO,
  RAIO,
  SOMBRA,
  SUPERFICIE_DE_RETORNO,
} from './tokens'

// O mesmo valor pode morar em dois arquivos - 'tokens.ts' para o Ant Design, 'tokens.css' para o
// CSS das telas. Este teste é o que impede os dois de sair de sincronia, que é como uma tela
// acaba com a cor da semana passada enquanto a do lado já mudou

/** O CSS é lido do disco e o caminho é relativo à raiz do projeto - que é onde o Vitest roda */
const css = readFileSync('src/app/tokens.css', 'utf8')

/**
 * Cada variável do CSS com o valor que ela chega a ter: `var(--x)` vira o valor de `--x`, e
 * `color-mix(in srgb, ...)` vira o hex que a conta dá. Assim o CSS pode escrever a regra, e o
 * teste compara o resultado com o hex que o `tokens.ts` calculou
 */
function variaveis(): Map<string, string> {
  const cruas = new Map<string, string>()
  // sem âncora de linha: o arquivo pode estar com CRLF, e aí $ não casa logo depois do ';'
  for (const [, nome, valor] of css.matchAll(/(--[a-z0-9-_]+):\s*([^;]+);/g)) {
    if (nome && valor) cruas.set(nome, valor.replace(/\s+/g, ' ').trim())
  }

  const resolver = (valor: string, caminho: string[] = []): string => {
    const apelido = /^var\((--[a-z0-9-_]+)\)$/.exec(valor)?.[1]
    if (apelido) {
      const alvo = cruas.get(apelido)
      if (alvo === undefined || caminho.includes(apelido)) return valor
      return resolver(alvo, [...caminho, apelido])
    }
    const mistura = /^color-mix\(in srgb, (.+) (\d+(?:\.\d+)?)%, (.+)\)$/.exec(valor)
    if (mistura) {
      const [, cima = '', peso = '', baixo = ''] = mistura
      return misturar(resolver(cima, caminho), resolver(baixo, caminho), Number(peso) / 100)
    }
    return valor
  }

  return new Map([...cruas].map(([nome, valor]) => [nome, resolver(valor)]))
}

function kebab(nome: string): string {
  return nome.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Cada constante de 'tokens.ts' com o nome que ela tem em 'tokens.css' */
function doTypeScript(): Map<string, string> {
  const mapa = new Map<string, string>()
  const por = (prefixo: string, objeto: Record<string, string | number>, unidade = '') => {
    for (const [chave, valor] of Object.entries(objeto)) {
      mapa.set(`--${prefixo}-${kebab(chave)}`, `${valor}${typeof valor === 'number' ? unidade : ''}`)
    }
  }

  por('cor', COR)
  por('cor', COR_DE_RETORNO)
  por('superficie', SUPERFICIE_DE_RETORNO)
  por('fase', FASE)
  por('fonte', FONTE)
  por('raio', RAIO, 'px')
  por('sombra', SOMBRA)
  por('movimento', MOVIMENTO)
  mapa.set('--altura-de-controle', `${ALTURA_DE_CONTROLE}px`)

  return mapa
}

describe('tokens.ts e tokens.css dizem a mesma coisa', () => {
  it('o valor que está nos dois arquivos é o mesmo', () => {
    const doCss = variaveis()
    const nosDois = [...doTypeScript()].filter(([nome]) => doCss.has(nome))

    // Sem isto, um erro no nome das variáveis faria o teste passar sem comparar nada
    expect(nosDois.length).toBeGreaterThan(0)

    for (const [nome, valor] of nosDois) {
      expect(doCss.get(nome), `${nome} diferente em tokens.ts e tokens.css`).toBe(valor)
    }
  })

  it('toda cor do tokens.ts tem a variável dela no CSS', () => {
    const doCss = variaveis()
    const cores = [...doTypeScript().keys()].filter((nome) =>
      /^--(cor|superficie|fase)-/.test(nome),
    )
    expect(cores.filter((nome) => !doCss.has(nome))).toEqual([])
  })
})

describe('contraste da paleta', () => {
  const TEXTO = 4.5
  const ELEMENTO_GRAFICO = 3

  const textoSobreFundo: [string, string, string][] = [
    ['texto sobre o fundo', COR.frente, COR.fundo],
    ['texto secundário sobre o fundo', COR.suaveFrente, COR.fundo],
    ['texto secundário sobre o suave', COR.suaveFrente, COR.suave],
    ['texto sobre a ação', COR.acaoFrente, COR.acao],
    ['texto sobre a ação com o mouse em cima', COR.acaoFrente, COR.acaoHover],
    ['texto sobre a ação pressionada', COR.acaoFrente, COR.acaoPressionada],
    ['ação sobre o fundo de ação', COR.acao, COR.acaoFundo],
    ['ação sobre o fundo de ação com o mouse em cima', COR.acao, COR.acaoFundoHover],
    ['link com o mouse em cima, sobre o cartão', COR.acaoHover, COR.cartao],
    ['texto sobre a marca', COR.marcaFrente, COR.marca],
    ['texto de apoio sobre a marca', COR.marcaFrenteSuave, COR.marca],
    ['texto sobre a marca com o mouse em cima', COR.marcaFrente, COR.marcaHover],
    ['verde institucional sobre o fundo dele', COR.institucionalTexto, COR.institucionalFundo],
    ['sucesso sobre a superfície dele', COR_DE_RETORNO.sucesso, SUPERFICIE_DE_RETORNO.sucessoFundo],
    ['aviso sobre a superfície dele', COR_DE_RETORNO.aviso, SUPERFICIE_DE_RETORNO.avisoFundo],
    ['erro sobre a superfície dele', COR_DE_RETORNO.erro, SUPERFICIE_DE_RETORNO.erroFundo],
    [
      'informação sobre a superfície dela',
      COR_DE_RETORNO.informacao,
      SUPERFICIE_DE_RETORNO.informacaoFundo,
    ],
    ...(['acasalado', 'mamando', 'prontoEstoque', 'estoque'] as const).map(
      (fase): [string, string, string] => [
        `texto da fase ${fase}`,
        FASE[`${fase}Texto`],
        FASE[`${fase}Fundo`],
      ],
    ),
    ...COR_DO_PARTO.map(({ cor, frente }, i): [string, string, string] => [
      `número sobre a cor do ${i + 1}º parto`,
      frente,
      cor,
    ]),
  ]

  it.each(textoSobreFundo)(`%s passa de ${TEXTO}:1`, (_, frente, fundo) => {
    expect(contraste(frente, fundo)).toBeGreaterThanOrEqual(TEXTO)
  })

  // O anel de foco é navegação de teclado: abaixo de 3:1 ninguém vê onde está
  it.each([
    ['fundo', COR.fundo],
    ['cartão', COR.cartao],
    ['suave', COR.suave],
  ])(`o anel de foco (a ação) passa de ${ELEMENTO_GRAFICO}:1 sobre o %s`, (_, fundo) => {
    expect(contraste(COR.acao, fundo)).toBeGreaterThanOrEqual(ELEMENTO_GRAFICO)
  })
})

describe('cor só nos tokens', () => {
  // A regra e os valores moram em três arquivos. Cor escrita em qualquer outro lugar é o começo
  // de cada tela com um azul diferente
  const ONDE_A_COR_MORA = new Set(['src/app/cor.ts', 'src/app/tokens.ts', 'src/app/tokens.css'])
  const COR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|color-mix)\(/gi

  it('nenhum componente ou tela escreve cor literal', () => {
    const arquivos = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .map((arquivo) => `src/${arquivo.replaceAll('\\', '/')}`)
      .filter((arquivo) => /\.(css|tsx?)$/.test(arquivo) && !/\.test\.tsx?$/.test(arquivo))
      .filter((arquivo) => !ONDE_A_COR_MORA.has(arquivo))

    // Sem isto, um caminho errado faria o teste passar sem ler arquivo nenhum
    expect(arquivos.length).toBeGreaterThan(10)

    const achados = arquivos.flatMap((arquivo) =>
      readFileSync(arquivo, 'utf8')
        .split('\n')
        .flatMap((linha, i) =>
          [...linha.matchAll(COR_LITERAL)].map(([cor]) => `${arquivo}:${i + 1} ${cor}`),
        ),
    )
    expect(achados).toEqual([])
  })
})
