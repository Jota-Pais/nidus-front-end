import { EmConstrucao } from './EmConstrucao'

export function Projetos() {
  return (
    <EmConstrucao
      titulo="Projetos de ética e cotas"
      ator="Gestor"
      requisitos={['RF-DEM-06', 'RN-12']}
      descricao="Número no formato institucional (23080.XXXXXX/AAAA-XX), vigência, responsável e cota autorizada, com controle de consumido/saldo e alerta abaixo do limiar configurável (hoje 20%)."
      atencao="PEN-10 em aberto: a cota é total por projeto ou por espécie, linhagem e sexo? É consumida na solicitação, na aprovação ou na entrega? Cota é limite legal, não conveniência."
    />
  )
}
