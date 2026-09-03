import { EmConstrucao } from './EmConstrucao'

export function Infraestrutura() {
  return (
    <EmConstrucao
      titulo="Infraestrutura e parametrização"
      ator="Gestor"
      requisitos={['RF-INF-01', 'RF-INF-02', 'RNF-05']}
      descricao="Cadastro de salas, estantes e modelos de estante, e os parâmetros administráveis: ciclo biológico por espécie, tabela de tolerância de idade, pares genéticos válidos, linhagens e limiares."
      atencao="RNF-05 — parametrização sem deploy. E RN-01 pede histórico: cálculo feito no passado precisa continuar reproduzível. No MVP o modelo de estante é coluna, não tabela, então o cadastro de modelo novo entra na fase 2."
    />
  )
}
