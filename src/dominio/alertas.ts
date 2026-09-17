/**
 * Alertas do ciclo — `contrato-api.md` §8, `RF-REP-07`.
 *
 * "O que vence hoje e nos próximos dias": painel com que o técnico começa o
 * dia. Transcrição do contrato — ver `useAlertas.ts` para a consulta.
 */
export interface CasalNoAlerta {
  identificacao: string
  cicloAtual: number
  maxCiclos: number
}

export interface ItemDoAlerta {
  idCaixa: number
  codigo: string
  numeroVisivel: string
  sala: string
  linhagem: string
  casal: CasalNoAlerta
}

/** Os três primeiros grupos do painel: têm data e podem estar atrasados. */
export interface ItemComData extends ItemDoAlerta {
  data: string
  /** A data prevista passou sem confirmação — o alerta mais importante do RF-REP-07. */
  atrasado: boolean
}

export interface Alertas {
  partosPrevistos: ItemComData[]
  desmamesPrevistos: ItemComData[]
  /** Sempre `atrasado: false` — não há o que confirmar num reacasalamento liberado. */
  reacasalamentosLiberados: ItemComData[]
  /** `RN-04`: casais ativos cujo ciclo corrente é o último permitido. */
  casaisNoUltimoCiclo: ItemDoAlerta[]
}
