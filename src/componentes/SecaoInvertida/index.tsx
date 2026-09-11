import type { ReactNode } from 'react'
import './estilos.css'

/**
 * Faixa invertida: fundo slate escuro, texto claro, malha de pontos.
 *
 * É a técnica de ritmo do design system — inverter o esquema de cor em uma
 * seção quebra a monotonia do tema claro e cria uma pausa sem precisar de
 * divisória pesada.
 *
 * Onde ela cabe no Nidus: **o painel de indicadores do dia** no topo dos
 * alertas do ciclo (`RF-REP-07`), e o resumo de capacidade da colônia. São os
 * números que o técnico olha primeiro ao abrir o sistema, e a inversão faz
 * exatamente isso — dá holofote.
 *
 * ⚠️ **Uma por tela.** Duas faixas escuras deixam de ser pausa e viram
 * listra. E não usar atrás de formulário: campo de entrada sobre fundo escuro
 * derruba o contraste que o `RNF-10` cobra.
 */
export function SecaoInvertida({
  children,
  comBrilho = true,
}: {
  children: ReactNode
  /** Brilho radial de acento no canto. Desligar quando houver outro ao lado. */
  comBrilho?: boolean
}) {
  return (
    <section
      className={`secaoInvertida padraoDePontos${comBrilho ? ' brilhoDeAcento' : ''}`}
    >
      <div className="secaoInvertida__conteudo">{children}</div>
    </section>
  )
}
