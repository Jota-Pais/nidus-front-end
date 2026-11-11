// O "hoje" do servidor. Em produção é o de quem usa a tela; no ambiente de teste o back pode
// ter um relógio adiantado, e a tela obedece a ele (o deslocamento vem junto da sessão)
import dayjs from 'dayjs'
import { useSyncExternalStore } from 'react'

const FORMATO = 'YYYY-MM-DD'

export interface RelogioDeTeste {
  deslocamentoDias: number
}

/** O que a sessão traz do relógio. Campo ausente vale como produção */
interface DadosDoRelogio {
  hoje?: string | undefined
  relogioDeTeste?: RelogioDeTeste | null | undefined
}

let deslocamentoDias = 0
let relogioDeTeste: RelogioDeTeste | null = null
const ouvintes = new Set<() => void>()

/** Chamado toda vez que a sessão chega: guarda quantos dias o servidor está à frente */
export function atualizarRelogio(dados: DadosDoRelogio | null | undefined): void {
  const hojeLocal = dayjs().startOf('day')
  const hojeDoServidor = dados?.hoje ? dayjs(dados.hoje, FORMATO, true) : null
  const novoDeslocamento =
    hojeDoServidor?.isValid() === true ? hojeDoServidor.diff(hojeLocal, 'day') : 0
  const novoRelogio = dados?.relogioDeTeste ?? null

  if (
    novoDeslocamento === deslocamentoDias &&
    novoRelogio?.deslocamentoDias === relogioDeTeste?.deslocamentoDias &&
    (novoRelogio === null) === (relogioDeTeste === null)
  )
    return
  deslocamentoDias = novoDeslocamento
  relogioDeTeste = novoRelogio
  ouvintes.forEach((ouvinte) => ouvinte())
}

/** Volta ao relógio local (logout e testes) */
export function zerarRelogio(): void {
  atualizarRelogio(null)
}

/** Quantos dias o hoje do servidor está à frente do hoje local */
export function deslocamentoDoRelogio(): number {
  return deslocamentoDias
}

/** hoje em 'aaaa-mm-dd', já com o deslocamento do servidor */
export function hojeDoRelogio(): string {
  return dayjs().add(deslocamentoDias, 'day').format(FORMATO)
}

/** O relógio de teste da sessão, ou null em produção. Redesenha quem usa quando ele muda */
export function useRelogioDeTeste(): (RelogioDeTeste & { hoje: string }) | null {
  const atual = useSyncExternalStore(
    (ouvir) => {
      ouvintes.add(ouvir)
      return () => ouvintes.delete(ouvir)
    },
    () => relogioDeTeste,
  )
  return atual ? { ...atual, hoje: hojeDoRelogio() } : null
}
