// Na entrega, de qual caixa tirar cada animal do pedido: o que sobrou na caixa do casal primeiro,
// depois as caixas de estoque. É a mesma conta que a API usa para descontar das caixas
import { Texto } from '@/componentes'
import { contarDoSexo, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useRetirada } from '@/dominio/consultas'
import './RetiradaDaEntrega.css'

export function RetiradaDaEntrega({ idSolicitacao }: { idSolicitacao: number }) {
  const retirada = useRetirada(idSolicitacao)

  if (retirada.isPending)
    return <Texto tom="secundario">Vendo de quais caixas tirar os animais…</Texto>
  if (!retirada.data || retirada.data.length === 0) return null

  return (
    <div className="retirada">
      <Texto tom="rotulo">Tirar das caixas</Texto>
      <ul className="retirada__lista">
        {retirada.data.map((item) => (
          <li key={`${item.numeroVisivel}-${item.codigo}-${item.sexo}`}>
            <strong>
              {SIMBOLO_DO_SEXO[item.sexo]} {contarDoSexo(item.qtd, item.sexo)}
            </strong>
            <span>
              da {item.tipo === 'estoque' ? 'caixa de estoque' : 'caixa do casal'} {item.codigo} (
              {item.numeroVisivel})
            </span>
            <span className="retirada__origem">
              {item.partos.map((p) => `${p.ordem}º parto do casal ${p.casal}`).join(', ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
