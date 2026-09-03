/**
 * Anexo A.2 — os 4 modelos de estante, e a geração da grade vazia.
 *
 * `RF-INF-01`: modelos de estante **não podem ser embutidos** — cada modelo é
 * cadastro (fabricante, nome, faces, linhas, colunas, esquema de nomeação), e
 * cadastrar modelo novo é operação de admin, não deploy. Estes quatro são dados
 * de carga inicial.
 *
 * ⚠️ **Em produção o front não gera grade nenhuma.** O `contrato-api.md` §5 é
 * explícito: `GET /api/estantes/:id/grade` devolve as `linhas × colunas`
 * posições de cada face já prontas, as vazias com `caixa: null`, porque não
 * existe tabela `slot` (decisão D-04 do modelo de dados). O front desenha o que
 * recebe — `RNF-01`.
 *
 * `enderecosDaEstante` existe para **desenvolver e testar a tela antes da API**,
 * e para conferir que a topologia do Anexo A fecha com a capacidade declarada.
 * Não chamar de dentro de tela que já consome a API.
 */
import type { Endereco, Face } from '@/dominio/tipos'

export interface ModeloEstante {
  id: number
  fabricante: 'ALESCO' | 'TECNIPLAST'
  nome: string
  linhas: number
  /** Colunas **por face**. A capacidade total considera as duas faces. */
  colunas: number
  capacidade: number
}

export const MODELOS_ESTANTE: ModeloEstante[] = [
  { id: 1, fabricante: 'ALESCO', nome: 'Modelo 1', linhas: 8, colunas: 8, capacidade: 128 },
  { id: 2, fabricante: 'ALESCO', nome: 'Modelo 2', linhas: 5, colunas: 5, capacidade: 50 },
  { id: 3, fabricante: 'TECNIPLAST', nome: 'Modelo 1', linhas: 8, colunas: 7, capacidade: 112 },
  { id: 4, fabricante: 'TECNIPLAST', nome: 'Modelo 2', linhas: 5, colunas: 4, capacidade: 40 },
]

export const FACES: Face[] = ['frontal', 'traseira']

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * ⚠️ **`CONF-07` — a letra da estante designa linha ou coluna?**
 *
 * O quadro do cliente descreve *"8L × 7C (A–G)"* — 7 letras para 7 colunas —
 * mas também *"8L × 8C (A–H)"*, onde 8 letras serviriam para os dois eixos.
 * Pela contagem a letra designa a **coluna**, mas o texto sugere o contrário.
 *
 * Precisa bater com a etiqueta física da estante: se errar, o técnico procura a
 * caixa no lugar errado (`RF-INF-02`). Enquanto o cliente não responde, fica
 * como parâmetro num lugar só — trocar aqui troca no sistema inteiro.
 *
 * O back-end assumiu a mesma coisa (`contrato-api.md` §5): **letra = coluna,
 * número = linha**, `A1` = coluna A, linha 1. Os dois lados combinaram de não
 * espalhar a suposição pelo resto do código, e é isto aqui que cumpre a parte do
 * front.
 */
export type EixoDaLetra = 'coluna' | 'linha'
export const EIXO_DA_LETRA: EixoDaLetra = 'coluna'

/**
 * Gera todos os endereços de uma estante, nas duas faces.
 *
 * A sequência de letras é **contínua entre as faces**: no ALESCO Modelo 1 a
 * frontal é A–H e a traseira I–P. A face não é sufixo, faz parte do endereço.
 */
export function enderecosDaEstante(
  idEstante: number,
  modelo: ModeloEstante,
  eixo: EixoDaLetra = EIXO_DA_LETRA,
): Endereco[] {
  const enderecos: Endereco[] = []

  FACES.forEach((face, indiceFace) => {
    const quantidadeDeLetras = eixo === 'coluna' ? modelo.colunas : modelo.linhas
    const deslocamento = indiceFace * quantidadeDeLetras

    for (let linha = 1; linha <= modelo.linhas; linha++) {
      for (let coluna = 1; coluna <= modelo.colunas; coluna++) {
        const indiceDaLetra = (eixo === 'coluna' ? coluna : linha) - 1 + deslocamento
        const letra = ALFABETO[indiceDaLetra]
        if (letra === undefined) {
          throw new Error(
            `Topologia sem letra disponível: ${modelo.fabricante} ${modelo.nome}, índice ${indiceDaLetra}`,
          )
        }
        const numero = eixo === 'coluna' ? linha : coluna
        enderecos.push({ idEstante, face, linha, coluna, codigo: `${letra}${numero}` })
      }
    }
  })

  return enderecos
}

/** Faixa de letras de uma face, para rótulo de cabeçalho. Ex.: `['A', 'H']`. */
export function faixaDeLetras(
  modelo: ModeloEstante,
  face: Face,
  eixo: EixoDaLetra = EIXO_DA_LETRA,
): [string, string] {
  const quantidade = eixo === 'coluna' ? modelo.colunas : modelo.linhas
  const inicio = (face === 'frontal' ? 0 : 1) * quantidade
  const primeira = ALFABETO[inicio]
  const ultima = ALFABETO[inicio + quantidade - 1]
  if (primeira === undefined || ultima === undefined) {
    throw new Error(`Topologia sem letra disponível: ${modelo.fabricante} ${modelo.nome}`)
  }
  return [primeira, ultima]
}
