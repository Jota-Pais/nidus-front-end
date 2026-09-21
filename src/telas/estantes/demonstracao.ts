// Grade de demonstração, para quando a API não está no ar
import type { CaixaNaGrade, Estante, FaceDaGrade, Grade, Posicao } from '@/dominio/estante'
import { COLUNAS_DO_QUADRO } from '@/dominio/estados'
import type { EstadoCaixa } from '@/dominio/tipos'
import { ESPECIES, PARES_GENETICOS_VALIDOS } from '@/fixtures/catalogo'
import { MODELOS_ESTANTE, enderecosDaEstante } from '@/fixtures/estantes'
import { hoje, somarDias } from '@/lib/data'

/**
 * Sorteio de estado, derivado de 'COLUNAS_DO_QUADRO' - nenhuma chave de estado
 * escrita à mão aqui
 */
const [PRIMEIRA, ...DEMAIS] = COLUNAS_DO_QUADRO
const ESTADOS: EstadoCaixa[] = [
  ...Array.from({ length: 3 }, () => PRIMEIRA!),
  ...DEMAIS,
]

/** RN-02 - a rotação em anel. Vem do catálogo, não é lista solta. */
const PARES = PARES_GENETICOS_VALIDOS

/** Determinístico: a mesma estante gera sempre a mesma grade, entre recargas */
function pseudoAleatorio(semente: number): number {
  const x = Math.sin(semente) * 10_000
  return x - Math.floor(x)
}

export const ESTANTES_DEMO: Estante[] = MODELOS_ESTANTE.map((modelo, indice) => ({
  id: indice + 1,
  sala: `Sala ${(indice % 3) + 1}`,
  fabricante: modelo.fabricante,
  modelo: modelo.nome,
  numeroVisivel: `E-0${indice + 1}`,
  topologia: {
    faces: 2,
    linhas: modelo.linhas,
    colunas: modelo.colunas,
    capacidade: modelo.capacidade,
  },
  ocupacao: {
    capacidade: modelo.capacidade,
    ocupada: Math.round(modelo.capacidade * 0.7),
    livre: modelo.capacidade - Math.round(modelo.capacidade * 0.7),
  },
  ativa: true,
}))

function caixaDemo(semente: number): CaixaNaGrade | null {
  const sorte = pseudoAleatorio(semente)
  if (sorte > 0.72) return null

  const especie = ESPECIES[semente % ESPECIES.length]!
  const linhagem = especie.linhagens[semente % especie.linhagens.length]!
  const estado = ESTADOS[Math.floor(pseudoAleatorio(semente + 7) * ESTADOS.length)]!
  const ciclo = 1 + Math.floor(pseudoAleatorio(semente + 13) * 5)
  const atrasado = pseudoAleatorio(semente + 29) > 0.88

  return {
    id: semente,
    especie: especie.codigo,
    linhagem,
    finalidade: 'reproducao',
    estado,
    casal: {
      id: semente,
      identificacao: PARES[semente % PARES.length]!,
      cicloAtual: ciclo,
      maxCiclos: 5,
    },
    proximoEvento: {
      tipo: pseudoAleatorio(semente + 3) > 0.5 ? 'parto_previsto' : 'desmame_previsto',
      data: somarDias(hoje(), atrasado ? -Math.ceil(pseudoAleatorio(semente) * 6) : Math.ceil(pseudoAleatorio(semente) * 20)),
      atrasado,
    },
  }
}

export function gradeDemo(estante: Estante): Grade {
  const modelo = MODELOS_ESTANTE.find(
    (m) => m.fabricante === estante.fabricante && m.nome === estante.modelo,
  )
  if (!modelo) throw new Error(`Modelo desconhecido: ${estante.fabricante} ${estante.modelo}`)

  const enderecos = enderecosDaEstante(estante.id, modelo)

  const faces: FaceDaGrade[] = (['frontal', 'traseira'] as const).map((face) => {
    const posicoes: Posicao[] = enderecos
      .filter((e) => e.face === face)
      .map((e, i) => ({
        linha: e.linha,
        coluna: e.coluna,
        codigo: e.codigo,
        caixa: caixaDemo(estante.id * 1000 + (face === 'frontal' ? 0 : 500) + i + 1),
      }))

    return { face, linhas: modelo.linhas, colunas: modelo.colunas, posicoes }
  })

  return {
    estante: {
      id: estante.id,
      sala: estante.sala,
      fabricante: estante.fabricante,
      modelo: estante.modelo,
      numeroVisivel: estante.numeroVisivel,
      topologia: estante.topologia,
    },
    faces,
  }
}
