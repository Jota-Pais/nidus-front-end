import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ALTURA_DE_CONTROLE,
  COR,
  COR_DE_RETORNO,
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

function variaveis(): Map<string, string> {
  const mapa = new Map<string, string>()
  // sem âncora de linha: o arquivo pode estar com CRLF, e aí $ não casa logo depois do ';'
  for (const [, nome, valor] of css.matchAll(/(--[a-z0-9-_]+):\s*([^;]+);/g)) {
    if (nome && valor) mapa.set(nome, valor.trim())
  }
  return mapa
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
})
