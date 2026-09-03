import { EmConstrucao } from './EmConstrucao'

export function RegistrosTecnico() {
  return (
    <EmConstrucao
      titulo="Registros do técnico"
      ator="Técnico"
      requisitos={['RF-REP-03', 'RF-REP-04', 'RF-REP-05', 'RF-REP-06', 'RNF-03']}
      descricao="Registro de parto, eutanásia de seleção, desmame e mortalidade. Confirmar um parto real recalcula toda a cadeia temporal à frente (RN-05) — o cálculo é do servidor."
      atencao="RNF-03 é requisito, não preferência de design: o registro acontece dentro da sala, com o técnico de luvas e paramentado. Tela pequena, alvos de toque generosos, mínimo de digitação. O tema já sobe os controles para 40px."
    />
  )
}
