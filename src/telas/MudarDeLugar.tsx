// Mudar a caixa de lugar pela ficha: a estante desenhada, um toque na posição vazia e a
// confirmação do destino. É o caminho do celular, onde o arrastar do navegador não funciona no
// toque, e vale também no computador, ao lado do arrastar da grade
import { App } from 'antd'
import { useState } from 'react'
import { Botao } from '@/componentes'
import type { LugarNaEstante } from '@/dominio/caixa'
import { useEstantes, useMudarDePosicao } from '@/dominio/consultas'
import type { DadosDaCaixa } from '@/dominio/tipos'
import { motivoDaFalha } from '@/layout/useFalhaDoFormulario'
import { EscolherCaixa } from './EscolherCaixa'

/** A caixa que muda de lugar, com tudo o que tem: os animais apontam para a caixa, não para o endereço */
export function MudarDeLugar({ caixa }: { caixa: Pick<DadosDaCaixa, 'id' | 'endereco'> }) {
  const { message } = App.useApp()
  const mover = useMudarDePosicao()
  const estantes = useEstantes()
  const [aberto, setAberto] = useState(false)
  const [destino, setDestino] = useState<LugarNaEstante | null>(null)
  const { codigo, sala, numeroVisivel } = caixa.endereco

  if (!aberto) {
    return (
      <div>
        <Botao onClick={() => setAberto(true)}>Mudar de lugar</Botao>
      </div>
    )
  }

  function fechar() {
    setDestino(null)
    setAberto(false)
  }

  // "F2D", ou "F2D da E-03" quando o destino é outra estante da sala
  const estanteDoDestino = estantes.data?.find((estante) => estante.id === destino?.idEstante)
  const ondeVai =
    destino === null
      ? null
      : estanteDoDestino && estanteDoDestino.numeroVisivel !== numeroVisivel
        ? `${destino.codigo} da ${estanteDoDestino.numeroVisivel}`
        : destino.codigo

  function confirmar() {
    if (destino === null) return

    mover.mutate(
      {
        idCaixa: caixa.id,
        idEstante: destino.idEstante,
        face: destino.face,
        linha: destino.linha,
        coluna: destino.coluna,
      },
      {
        onSuccess: () => {
          void message.success(`Caixa mudou de lugar.`)
          fechar()
        },
        onError: (erro) => void message.error(motivoDaFalha(erro)),
      },
    )
  }

  return (
    <div className="ficha__formulario mudarDeLugar">
      <p className="ficha__dica">
        Toque numa posição vazia: a caixa {codigo} vai para lá com os animais.
      </p>
      <EscolherCaixa
        sala={sala}
        numeroVisivel={numeroVisivel}
        sexo={null}
        idLinhagem={null}
        aceitaVazia
        idOrigem={caixa.id}
        value={destino}
        onChange={setDestino}
      />
      <div className="ficha__botoes">
        <Botao
          variante="primario"
          disabled={destino === null}
          loading={mover.isPending}
          onClick={confirmar}
        >
          {ondeVai ? `Mudar para ${ondeVai}` : 'Mudar'}
        </Botao>
        <Botao variante="fantasma" onClick={fechar}>
          Cancelar
        </Botao>
      </div>
    </div>
  )
}
