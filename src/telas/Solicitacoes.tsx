import { EmConstrucao } from './EmConstrucao'

export function Solicitacoes() {
  return (
    <EmConstrucao
      titulo="Solicitações"
      ator="Pesquisador (acompanhar) · Técnico e Gestor (analisar)"
      requisitos={['RF-DEM-01', 'RF-DEM-02', 'RF-DEM-05', 'RF-MOT-05', 'RF-MOT-06']}
      descricao="Nova solicitação, acompanhamento pelo solicitante e análise com as sugestões do motor de atendimento. Quando a data é inviável, o sistema informa a data mais próxima possível em vez de só recusar."
      atencao="Os números da análise dependem de CONF-01 (idade conta do nascimento ou do desmame — 22 dias) e CONF-06 (mais velho primeiro × idade mais próxima). O layout pode ser desenhado; os números, não."
    />
  )
}
