import { Dica } from '@/componentes/Dica'
import { Etiqueta } from '@/componentes/Etiqueta'
import { Linha } from '@/componentes/Linha'
import { Pilha } from '@/componentes/Pilha'
import { Texto } from '@/componentes/Texto'
import { COLUNAS_DO_QUADRO, ESTADO_CAIXA, GRAU_CERTEZA, ORDEM_GRAU_CERTEZA } from './estados'
import type { CodificacaoVisual } from './estados'
import type { EstadoCaixa, GrauCerteza } from './tipos'
import './legenda.css'

/**
 * `RNF-10` — a legenda compartilhada por grade, quadro e ficha.
 *
 * Uma legenda só, não três. Cada marca leva **marcador** (forma), **sigla**
 * (texto) e superfície (cor), de modo que a informação sobreviva a
 * daltonismo, leitor de tela e impressão em preto e branco.
 *
 * ⚠️ **A cor vem dos tokens, não do Ant Design.** Antes cada marca usava um
 * preset (`blue`, `gold`, `volcano`), que é outra paleta: ao lado do azul e do
 * verde da UFSC, ficava parecendo outro sistema. Agora o estado da caixa usa
 * exatamente a mesma superfície que o card da grade e o do quadro — é o que
 * garante, na folha de estilo, o que o `RF-CIC-02` exige no dado.
 */

function Marca({ visual, tom }: { visual: CodificacaoVisual; tom?: string }) {
  return (
    <Dica texto={visual.descricao}>
      <span
        className={tom ? `marcaDeEstado marcaDeEstado--${tom}` : undefined}
        aria-label={`${visual.rotulo}: ${visual.descricao}`}
      >
        <Etiqueta>
          <span aria-hidden="true">{visual.marcador}</span> {visual.sigla}
        </Etiqueta>
      </span>
    </Dica>
  )
}

export function MarcaEstadoCaixa({ estado }: { estado: EstadoCaixa }) {
  return <Marca visual={ESTADO_CAIXA[estado]} tom={estado} />
}

/**
 * `RN-08` — grau de certeza da oferta.
 *
 * ⚠️ O `projetado` sai em vermelho não por ser um erro, e sim por ser o de
 * maior risco: quantidade e data estimadas, animal que ainda não nasceu. Quem
 * carrega o significado é a sigla e a descrição — a cor é o terceiro canal.
 */
export function MarcaGrauCerteza({ grau }: { grau: GrauCerteza }) {
  const tom = grau === 'confirmado' ? 'sucesso' : grau === 'previsto' ? 'atencao' : 'erro'
  return (
    <Dica texto={GRAU_CERTEZA[grau].descricao}>
      <Etiqueta tom={tom}>
        <span aria-hidden="true">{GRAU_CERTEZA[grau].marcador}</span> {GRAU_CERTEZA[grau].sigla}
      </Etiqueta>
    </Dica>
  )
}

export function Legenda() {
  return (
    <Pilha espaco={12}>
      <div>
        <Texto tom="rotulo">Estado da caixa</Texto>
        <Linha espaco={12} estilo={{ marginTop: 6 }}>
          {COLUNAS_DO_QUADRO.map((estado) => (
            <Linha key={estado} espaco={6}>
              <MarcaEstadoCaixa estado={estado} />
              <Texto tom="secundario">{ESTADO_CAIXA[estado].rotulo}</Texto>
            </Linha>
          ))}
        </Linha>
      </div>

      <div>
        <Texto tom="rotulo">Grau de certeza da oferta</Texto>
        <Linha espaco={12} estilo={{ marginTop: 6 }}>
          {ORDEM_GRAU_CERTEZA.map((grau) => (
            <Linha key={grau} espaco={6}>
              <MarcaGrauCerteza grau={grau} />
              <Texto tom="secundario">{GRAU_CERTEZA[grau].rotulo}</Texto>
            </Linha>
          ))}
        </Linha>
      </div>
    </Pilha>
  )
}
