import { EmConstrucao } from './EmConstrucao'

export function PainelAlertas() {
  return (
    <EmConstrucao
      titulo="Alertas do ciclo"
      ator="Técnico"
      requisitos={['RF-REP-07']}
      descricao="O que vence hoje e nos próximos dias: partos previstos, desmames, reacasalamentos liberados, casais no último ciclo e previsões vencidas sem confirmação. É a tela em que o técnico começa o dia."
      atencao="Previsão vencida sem confirmação precisa gritar: é o principal ponto de erosão silenciosa da confiabilidade dos dados."
    />
  )
}
