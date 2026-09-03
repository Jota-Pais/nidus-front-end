import { EmConstrucao } from './EmConstrucao'

export function Quadro() {
  return (
    <EmConstrucao
      titulo="Quadro de comprometimento"
      ator="Técnico / Gestor"
      requisitos={['RF-CIC-01', 'RF-CIC-02', 'RF-CIC-03', 'RF-CIC-04', 'RF-CIC-05']}
      descricao="Um quadro por espécie, sem mistura, com as cinco colunas de estado de comprometimento. Cards clicáveis abrem a mesma ficha da grade. Ciclo reprodutivo (1º ao 5º) visível no card, com legenda. Filtros por linhagem, sala, colônia, projeto comprometido e janela de datas previstas."
      atencao="A segregação por espécie é aplicada no servidor, não por filtro de interface (RF-CIC-01). Depende da decisão de drag-and-drop — o RF-CIC-03 exige registrar a transição, não exige arrastar."
    />
  )
}
