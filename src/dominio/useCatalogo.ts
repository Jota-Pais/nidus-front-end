/**
 * Dados de referência — `contrato-api.md` §4, `GET /api/catalogo`.
 *
 * É a carga inicial do Anexo A vinda do servidor: espécies, linhagens,
 * parâmetros do ciclo biológico, tabela de tolerância de idade e pares
 * genéticos válidos.
 *
 * ⚠️ **Nada disto é constante de código.** O `RNF-05` exige parametrização sem
 * deploy e o `RN-01` exige histórico — cálculo feito no passado precisa
 * continuar reproduzível. Os valores em `@/fixtures/catalogo` existem só para
 * desenvolver sem API; em produção quem manda é esta consulta.
 */
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { chaves } from '@/app/chaves'
import { api } from '@/lib/api'
import type { CodigoEspecie, GrupoGenetico } from './tipos'

export interface EspecieDoCatalogo {
  codigo: CodigoEspecie
  nome: string
  nomeCientifico: string
  linhagens: string[]
}

export interface ParametroBiologico {
  especie: CodigoEspecie
  gestacaoDias: number
  aleitamentoDias: number
  intervaloEntreCiclosDias: number
  maxPartosPorCasal: number
}

export interface FaixaDeTolerancia {
  minimo: number
  maximo: number | null
  variacao: number
}

export interface Catalogo {
  especies: EspecieDoCatalogo[]
  parametrosBiologicos: ParametroBiologico[]
  toleranciaIdade: FaixaDeTolerancia[]
  paresGeneticos: string[]
  gruposGeneticos: GrupoGenetico[]
}

export function useCatalogo(): UseQueryResult<Catalogo> {
  return useQuery({
    queryKey: chaves.catalogo,
    queryFn: () => api<Catalogo>('/api/catalogo'),
    /**
     * Uma hora. É cadastro que o gestor muda de vez em quando, não estado da
     * colônia: revalidar a cada meio minuto seria requisição jogada fora numa
     * tela que o técnico deixa aberta o turno inteiro.
     */
    staleTime: 60 * 60_000,
  })
}
