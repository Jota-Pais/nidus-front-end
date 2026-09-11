/**
 * Vocabulário do domínio.
 *
 * Os termos vêm do glossário da seção 2 do documento de requisitos
 * (`requisitos-v0.2-spec-cliente-v2.4.md`). A equipe não conhece o vocabulário
 * de biotério: usar estes nomes na interface e no código, sem sinônimo
 * inventado. "Slot" virou "posição", "Kanban" virou "quadro" — foi assim que o
 * cliente escreveu.
 */

/** `RF-ACS-*` — os três perfis. Autorização é sempre decidida no servidor. */
export type Perfil = 'pesquisador' | 'tecnico' | 'gestor'

export const PERFIS: Record<Perfil, { rotulo: string; descricao: string }> = {
  pesquisador: {
    rotulo: 'Pesquisador',
    descricao: 'Solicita dentro da cota do projeto. Não enxerga a colônia.',
  },
  tecnico: {
    rotulo: 'Técnico',
    descricao: 'Opera a colônia, registra eventos e analisa solicitações.',
  },
  gestor: {
    rotulo: 'Gestor',
    descricao: 'Tudo do técnico, mais aprovação, parametrização e auditoria.',
  },
}

export type CodigoEspecie = 'rato' | 'camundongo'

/** As duas faces da estante. A face faz parte do endereço, não é sufixo. */
export type Face = 'frontal' | 'traseira'

/**
 * `RF-CIC-*` — estado de comprometimento da caixa, as 5 colunas do quadro.
 *
 * Chaves legíveis, de propósito: o `char(1)` do banco (`infra.caixa.estado`)
 * **nunca cruza a rede** — quem traduz é o back-end (`contrato-api.md` §1.1).
 * O front nunca vê `'R'`, `'P'` ou `'C'`.
 *
 * ⚠️ Os valores deste arquivo e de `estados.ts` **são o contrato**: o
 * `contrato-api.md` aponta para cá. Renomear uma chave aqui quebra a API — muda
 * nos dois repositórios, no mesmo PR ou em PRs irmãos.
 */
export type EstadoCaixa =
  | 'em_reproducao'
  | 'parcialmente_comprometida'
  | 'totalmente_comprometida'
  | 'preparada_para_envio'
  | 'expedida'

/** Finalidade da caixa, do modelo conceitual. `contrato-api.md` §1.1. */
export type FinalidadeCaixa = 'reproducao' | 'maternidade' | 'recria' | 'expedicao'

/** `RN-08` — grau de certeza da oferta. Define prioridade e risco. */
export type GrauCerteza = 'confirmado' | 'previsto' | 'projetado'

/** Grupos genéticos do cruzamento rotacional (`RN-02`). */
export type GrupoGenetico = 'A' | 'B' | 'C' | 'D' | 'E'

/** Data em ISO `aaaa-mm-dd`. Exibição é sempre `dd/mm/aaaa` — ver `lib/data.ts`. */
export type DataISO = string

/** Endereço físico de uma posição na estante (`RF-INF-02`). */
export interface Endereco {
  idEstante: number
  face: Face
  linha: number
  coluna: number
  /** Como a etiqueta aparece na estante real. Ex.: `C3`. */
  codigo: string
}

/**
 * Quantidade por sexo, a forma em que o contrato conta animal em todo lugar:
 * nascido, eutanasiado de seleção, desmamado, disponível, comprometido e
 * pedido da solicitação (`contrato-api.md` §6 e §8).
 *
 * Contar em dois números separados, e não num total, não é detalhe de
 * modelagem: o pesquisador pede por sexo e o motor atende por sexo (`RN-09`).
 */
export interface PorSexo {
  m: number
  f: number
}
