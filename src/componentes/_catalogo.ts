// Dados de referência para os seletores, com rede de segurança
import { useCatalogo } from '@/dominio/useCatalogo'
import type { Catalogo } from '@/dominio/useCatalogo'
import { ESPECIES, GRUPOS_GENETICOS, PARES_GENETICOS_VALIDOS, SALAS } from '@/fixtures/catalogo'

/** salas não existe no tipo 'Catalogo'. */
export const SALAS_DO_ANEXO: string[] = SALAS.map((numero) => `Sala ${numero}`)

const RESERVA: Catalogo = {
  especies: ESPECIES,
  parametrosBiologicos: [],
  toleranciaIdade: [],
  paresGeneticos: [...PARES_GENETICOS_VALIDOS],
  gruposGeneticos: GRUPOS_GENETICOS,
}

/** O catálogo do servidor; na ausência dele, o do Anexo A */
export function useCatalogoComReserva(): { catalogo: Catalogo; carregando: boolean } {
  const consulta = useCatalogo()
  return { catalogo: consulta.data ?? RESERVA, carregando: consulta.isPending }
}
