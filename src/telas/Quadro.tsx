import { useState } from 'react'
import {
  BotaoDeMoverEstado,
  CabecalhoDaTela,
  CardDaCaixa,
  ColunaDoQuadro,
  DialogoDeExcecao,
  EstadoDaConsulta,
  FichaDaCaixa,
  Legenda,
  Pilha,
  Recolhivel,
  Secao,
  SeletorDeEspecie,
  useAbrirFicha,
  Vazio,
} from '@/componentes'
import type { CodigoEspecie, EstadoCaixa } from '@/dominio/tipos'
import { useMoverCaixa, useQuadro } from '@/dominio/useQuadro'
import './Quadro.css'

/** O que está pendente de confirmação: a caixa e o destino que o 409 recusou. */
interface MovimentoPendente {
  idCaixa: number
  destino: EstadoCaixa
}

/** RF-CIC-01 a RF-CIC-04 - o quadro de comprometimento */
export function Quadro() {
  const [especie, setEspecie] = useState<CodigoEspecie>('rato')
  const quadro = useQuadro(especie)
  const mover = useMoverCaixa()
  const abrirFicha = useAbrirFicha()
  const [pendente, setPendente] = useState<MovimentoPendente | null>(null)

  function moverPara(idCaixa: number, destino: EstadoCaixa) {
    setPendente({ idCaixa, destino })
    mover.mutate({ idCaixa, pedido: { estado: destino, justificativa: null, confirmar: false } })
  }

  function confirmarMesmoAssim() {
    if (pendente === null) return

    mover.mutate({
      idCaixa: pendente.idCaixa,
      pedido: { estado: pendente.destino, justificativa: null, confirmar: true },
    })
  }

  function cancelarExcecao() {
    setPendente(null)
    mover.reset()
  }

  const semCaixa = quadro.data?.colunas.every((coluna) => coluna.total === 0) ?? false

  return (
    <Pilha>
      <CabecalhoDaTela
        titulo="Quadro de acompanhamento"
        rotulo="Reprodução"
        descricao="O comprometimento de cada caixa, por espécie. Mover entre colunas é sempre pelo botão — nunca arrastar: a mudança pode quebrar um compromisso já firmado."
      />

      <Secao>
        <SeletorDeEspecie value={especie} onChange={setEspecie} />
      </Secao>

      <Recolhivel paineis={[{ chave: 'legenda', titulo: 'Legenda', conteudo: <Legenda /> }]} />

      <EstadoDaConsulta consulta={quadro} rotulo="Carregando o quadro…">
        {semCaixa ? (
          <Vazio descricao="Nenhuma caixa em ciclo reprodutivo para esta espécie." />
        ) : (
          <div className="quadro">
            {quadro.data?.colunas.map((coluna) => (
              <ColunaDoQuadro
                key={coluna.estado}
                estado={coluna.estado}
                total={coluna.total}
                vazia="Nenhuma caixa neste estado."
              >
                <Pilha espaco={10}>
                  {coluna.cards.map((card) => (
                    <CardDaCaixa
                      key={card.idCaixa}
                      card={card}
                      estado={coluna.estado}
                      aoAbrir={abrirFicha}
                      acoes={
                        <BotaoDeMoverEstado
                          atual={coluna.estado}
                          aoMover={(destino) => moverPara(card.idCaixa, destino)}
                          carregando={mover.isPending && pendente?.idCaixa === card.idCaixa}
                        />
                      }
                    />
                  ))}
                </Pilha>
              </ColunaDoQuadro>
            ))}
          </div>
        )}
      </EstadoDaConsulta>

      <DialogoDeExcecao
        erro={mover.error}
        aoConfirmar={confirmarMesmoAssim}
        aoCancelar={cancelarExcecao}
        confirmando={mover.isPending}
      />

      <FichaDaCaixa />
    </Pilha>
  )
}
