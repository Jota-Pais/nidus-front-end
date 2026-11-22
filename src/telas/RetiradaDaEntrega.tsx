// Na entrega, de qual caixa tirar cada animal do pedido: onde os reservados estão de fato. Se a
// equipe juntou os reservados numa caixa, é ela que aparece. Dentro da caixa só a idade distingue
// os ratos, então cada linha diz também quando eles nasceram
import { Aviso, Texto } from '@/componentes'
import { contarDoSexo, descreverOrigens, ehCadastroInicial, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useRetirada } from '@/dominio/consultas'
import type { LugarDaRetirada } from '@/dominio/tipos'
import { descreverDias, formatarData, idadeEmDias } from '@/lib/data'
import './RetiradaDaEntrega.css'

const TIPO: Record<LugarDaRetirada['tipo'], string> = {
  estoque: 'caixa de estoque',
  casal: 'caixa do casal',
  viuvas: 'caixa de viúvas',
}

export function RetiradaDaEntrega({ idPedido }: { idPedido: number }) {
  const retirada = useRetirada(idPedido)

  if (retirada.isPending) {
    return <Texto tom="secundario">Vendo de quais caixas tirar os animais…</Texto>
  }
  if (retirada.isError) {
    return (
      <div className="retirada">
        <Aviso tom="atencao" titulo="Não deu para ver de quais caixas tirar os animais.">
          {retirada.error.message}
        </Aviso>
      </div>
    )
  }
  if (retirada.data.length === 0) return null

  return (
    <div className="retirada">
      <Texto tom="rotulo">Tirar das caixas</Texto>
      <ul className="retirada__lista">
        {retirada.data.map((lugar) => (
          <li key={`${lugar.numeroVisivel}-${lugar.codigo}-${lugar.sexo}-${lugar.dtNascimento}`}>
            <strong>
              {SIMBOLO_DO_SEXO[lugar.sexo]} {contarDoSexo(lugar.qtd, lugar.sexo)}
            </strong>
            <span>
              da {TIPO[lugar.tipo]} <span className="retirada__codigo">{lugar.codigo}</span> (
              {lugar.numeroVisivel})
            </span>
            <span className="retirada__origem">
              {ehCadastroInicial(lugar.partos)
                ? `Cadastro inicial · nascidos em ${formatarData(lugar.dtNascimento)} (${descreverDias(idadeEmDias(lugar.dtNascimento))} hoje)`
                : `Nascimento em ${formatarData(lugar.dtNascimento)} (${descreverDias(idadeEmDias(lugar.dtNascimento))} hoje) · ${descreverOrigens(lugar.partos)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
