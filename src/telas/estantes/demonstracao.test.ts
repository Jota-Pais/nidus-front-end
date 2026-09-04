import { describe, expect, it } from 'vitest'
import { porLinha } from '@/dominio/estante'
import { ESTANTES_DEMO, gradeDemo } from './demonstracao'

describe('ESTANTES_DEMO', () => {
  it('cobre os quatro modelos do Anexo A', () => {
    expect(ESTANTES_DEMO).toHaveLength(4)
    expect(ESTANTES_DEMO.map((e) => e.topologia.capacidade)).toEqual([128, 50, 112, 40])
  })

  it('ocupada e livre fecham com a capacidade', () => {
    for (const estante of ESTANTES_DEMO) {
      const { capacidade, ocupada, livre } = estante.ocupacao
      expect(ocupada + livre).toBe(capacidade)
      expect(capacidade).toBe(estante.topologia.capacidade)
    }
  })
})

describe('gradeDemo', () => {
  it('gera as duas faces com a contagem de posições da topologia', () => {
    for (const estante of ESTANTES_DEMO) {
      const grade = gradeDemo(estante)
      expect(grade.faces).toHaveLength(2)
      const total = grade.faces.reduce((soma, f) => soma + f.posicoes.length, 0)
      expect(total).toBe(estante.topologia.capacidade)
    }
  })

  it('não repete código de posição dentro da estante', () => {
    for (const estante of ESTANTES_DEMO) {
      const codigos = gradeDemo(estante).faces.flatMap((f) => f.posicoes.map((p) => p.codigo))
      expect(new Set(codigos).size).toBe(codigos.length)
    }
  })

  it('é determinístico: recarregar a página não embaralha a estante', () => {
    const estante = ESTANTES_DEMO[0]!
    const primeira = JSON.stringify(gradeDemo(estante))
    const segunda = JSON.stringify(gradeDemo(estante))
    expect(primeira).toBe(segunda)
  })

  it('cada face preenche todas as linhas da topologia', () => {
    const estante = ESTANTES_DEMO[0]!
    for (const face of gradeDemo(estante).faces) {
      const linhas = porLinha(face)
      expect(linhas).toHaveLength(estante.topologia.linhas)
      expect(linhas.every((l) => l.length === estante.topologia.colunas)).toBe(true)
    }
  })

  it('produz caixa vazia e caixa ocupada, senão a legenda não tem o que mostrar', () => {
    const posicoes = gradeDemo(ESTANTES_DEMO[0]!).faces.flatMap((f) => f.posicoes)
    expect(posicoes.some((p) => p.caixa === null)).toBe(true)
    expect(posicoes.some((p) => p.caixa !== null)).toBe(true)
  })

  it('produz ao menos uma previsão vencida, que é o alerta do RF-REP-07', () => {
    const caixas = ESTANTES_DEMO.flatMap((e) =>
      gradeDemo(e).faces.flatMap((f) => f.posicoes.map((p) => p.caixa)),
    )
    expect(caixas.some((c) => c?.proximoEvento?.atrasado === true)).toBe(true)
  })

  it('respeita o RN-02: todo casal usa par da rotação em anel', () => {
    const permitidos = new Set(['AB', 'BC', 'CD', 'DE', 'EA'])
    const casais = ESTANTES_DEMO.flatMap((e) =>
      gradeDemo(e).faces.flatMap((f) => f.posicoes.map((p) => p.caixa?.casal).filter(Boolean)),
    )
    expect(casais.length).toBeGreaterThan(0)
    expect(casais.every((c) => permitidos.has(c!.identificacao))).toBe(true)
  })

  it('respeita o RN-04: nenhum casal passa do 5º ciclo', () => {
    const casais = ESTANTES_DEMO.flatMap((e) =>
      gradeDemo(e).faces.flatMap((f) => f.posicoes.map((p) => p.caixa?.casal).filter(Boolean)),
    )
    expect(casais.every((c) => c!.cicloAtual >= 1 && c!.cicloAtual <= 5)).toBe(true)
  })

  it('respeita o catálogo: linhagem sempre da espécie da caixa', () => {
    const porEspecie: Record<string, string[]> = {
      rato: ['Wistar', 'SHR', 'Kyoto'],
      camundongo: ['Swiss', 'C57BL/6J'],
    }
    const caixas = ESTANTES_DEMO.flatMap((e) =>
      gradeDemo(e).faces.flatMap((f) => f.posicoes.map((p) => p.caixa).filter(Boolean)),
    )
    for (const caixa of caixas) {
      expect(porEspecie[caixa!.especie]).toContain(caixa!.linhagem)
    }
  })
})
