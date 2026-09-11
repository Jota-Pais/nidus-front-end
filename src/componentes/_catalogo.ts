/**
 * Dados de referência para os seletores, com rede de segurança.
 *
 * O `_` no nome marca o que é interno da pasta de componentes: não sai no
 * barril e não é para tela importar.
 *
 * Os seletores precisam de espécie, linhagem, sala e par genético antes de a
 * API existir — senão não dá para desenhar tela nenhuma. A regra é a mesma
 * que a `GradeEstantes` já aplica: **a fonte é o servidor**, e o Anexo A em
 * `@/fixtures/catalogo` só entra quando a consulta não trouxe nada.
 *
 * ⚠️ Isto **não** é mock de comportamento (`RNF-01`). São as listas de carga
 * inicial do cliente, que o `RNF-05` manda serem parametrizáveis sem deploy —
 * nenhum número exibido ao usuário sai daqui.
 */
import { useCatalogo } from '@/dominio/useCatalogo'
import type { Catalogo } from '@/dominio/useCatalogo'
import { ESPECIES, GRUPOS_GENETICOS, PARES_GENETICOS_VALIDOS, SALAS } from '@/fixtures/catalogo'

/**
 * ⚠️ **`salas` não existe no tipo `Catalogo`.**
 *
 * O `contrato-api.md` §4 devolve `"salas": ["Sala 1", …]`, mas
 * `@/dominio/useCatalogo` não transcreveu o campo. Enquanto isso não fecha —
 * e fechar é mudar o contrato nos dois repositórios, não aqui — a lista sai
 * do Anexo A. O `SeletorDeSala` aceita `salas` por propriedade para a tela
 * poder passar a de verdade assim que ela existir.
 */
export const SALAS_DO_ANEXO: string[] = SALAS.map((numero) => `Sala ${numero}`)

const RESERVA: Catalogo = {
  especies: ESPECIES,
  parametrosBiologicos: [],
  toleranciaIdade: [],
  paresGeneticos: [...PARES_GENETICOS_VALIDOS],
  gruposGeneticos: GRUPOS_GENETICOS,
}

/** O catálogo do servidor; na ausência dele, o do Anexo A. */
export function useCatalogoComReserva(): { catalogo: Catalogo; carregando: boolean } {
  const consulta = useCatalogo()
  return { catalogo: consulta.data ?? RESERVA, carregando: consulta.isPending }
}
