// A trilha da caixa de estoque na ficha: de onde vieram os animais que passaram por ela e para
// onde foram, com a data de cada passagem. Na caixa liberada é o que resta para dizer onde estão
import {
  descreverAnimais,
  descreverOrigemDaPassagem,
  descreverPassagem,
  separarATrilha,
} from '@/dominio/trilha'
import type { PassagemDoEstoque } from '@/dominio/tipos'
import { formatarData } from '@/lib/data'
import { Campo } from './CamposDaFicha'

function ListaDePassagens({ passagens, vazio }: { passagens: PassagemDoEstoque[]; vazio: string }) {
  if (passagens.length === 0) return <p className="ficha__vazio">{vazio}</p>

  return (
    <ul className="ficha__lista">
      {passagens.map((passagem) => (
        <li key={`${passagem.idOcorrencia}-${passagem.sentido}`} className="fichaDoEstoque__grupo">
          <strong>
            {formatarData(passagem.dtFato)} · {descreverPassagem(passagem)}
          </strong>
          <ul className="fichaDoEstoque__origens">
            {passagem.origens.map((origem) => (
              <li key={origem.idParto}>{descreverOrigemDaPassagem(origem)}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

/** Os animais que chegaram à caixa e os que saíram dela, cada lado com o total */
export function TrilhaDoEstoque({ trilha }: { trilha: PassagemDoEstoque[] }) {
  const { chegadas, saidas, chegaram, sairam } = separarATrilha(trilha)

  return (
    <>
      <h3>De onde vieram</h3>
      <Campo rotulo="Chegaram">{descreverAnimais(chegaram)}</Campo>
      <ListaDePassagens passagens={chegadas} vazio="Nenhum animal chegou a esta caixa." />

      <h3>Para onde foram</h3>
      <Campo rotulo="Saíram">{descreverAnimais(sairam)}</Campo>
      <ListaDePassagens passagens={saidas} vazio="Nenhum animal saiu desta caixa." />
    </>
  )
}
