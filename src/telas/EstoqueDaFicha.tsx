// A ficha da caixa de estoque: os vivos dela por data de nascimento (dentro da caixa, só a idade
// os separa), de onde vieram, o que cada pedido tem reservado nela, o que aconteceu com eles e os
// casais da caixa, se ela foi de casal antes de virar de estoque. As ações são as de qualquer
// caixa: baixa e mudar animais de caixa. Aqui fica também a caixa do
// casal encerrado que vira de estoque no lugar
import { App, Tabs } from 'antd'
import { useState } from 'react'
import { Aviso, Botao } from '@/componentes'
import {
  contarDoSexo,
  descreverLiberacao,
  reservadosDoSexo,
  ROTULO_DO_SEXO,
  SIMBOLO_DO_SEXO,
} from '@/dominio/caixa'
import { useVirarCaixaDeEstoque } from '@/dominio/consultas'
import type { CasalComPartos, FichaDeEstoque, Parto, Sexo } from '@/dominio/tipos'
import { descreverDias, formatarData, idadeEmDias } from '@/lib/data'
import { BaixaNaCaixa, MudarAnimais } from './AnimaisDaFicha'
import { AcrescentarAnimais } from './CadastroInicial'
import type { CaixaDaAcao, GrupoDaCaixa } from './AnimaisDaFicha'
import { Campo, LadoALado } from './CamposDaFicha'
import './EstoqueDaFicha.css'

/** "28 dias", ou "25 a 31 dias" quando as idades são diferentes */
function idadeDe(nascimentoDe: string | null, nascimentoAte: string | null): string {
  if (!nascimentoDe || !nascimentoAte) return '—'

  const maisVelho = idadeEmDias(nascimentoDe)
  const maisNovo = idadeEmDias(nascimentoAte)

  return maisVelho === maisNovo
    ? descreverDias(maisVelho)
    : `${maisNovo} a ${descreverDias(maisVelho)}`
}

/** Os animais de um sexo só, na forma que as ações por sexo esperam */
const doSexoDaCaixa = (sexo: Sexo, qtd: number) =>
  sexo === 'M' ? { m: qtd, f: 0 } : { m: 0, f: qtd }

export function FichaDoEstoque({ ficha }: { ficha: FichaDeEstoque }) {
  const { caixa } = ficha
  const daAcao: CaixaDaAcao = {
    id: caixa.id,
    endereco: caixa.endereco,
    idLinhagem: caixa.idLinhagem,
  }

  return (
    <Tabs
      items={[
        {
          key: 'animais',
          label: 'Animais',
          children: <AbaDosAnimais ficha={ficha} caixa={daAcao} />,
        },
        ...(ficha.casaisAnteriores.length > 0
          ? [
              {
                key: 'casais',
                label: 'Casais anteriores',
                children: <CasaisAnteriores casais={ficha.casaisAnteriores} />,
              },
            ]
          : []),
      ]}
    />
  )
}

function AbaDosAnimais({ ficha, caixa }: { ficha: FichaDeEstoque; caixa: CaixaDaAcao }) {
  const [acao, setAcao] = useState<'baixa' | 'mudanca' | 'entrada' | null>(null)
  const { sexo, ativa } = ficha.caixa
  // a API diz o que cada pedido tem reservado em cada idade e quando os vivos dela chegaram
  const grupos: GrupoDaCaixa[] = ficha.grupos.map((grupo) => ({
    dtNascimento: grupo.dtNascimento,
    vivos: doSexoDaCaixa(sexo, grupo.total),
    reservas: grupo.pedidos.map((pedido) => ({
      idPedido: pedido.idPedido,
      ...doSexoDaCaixa(sexo, pedido.qtd),
    })),
    dtChegada: grupo.dtChegada,
  }))

  return (
    <div className="ficha__aba">
      <div className="ficha__casal">
        {ativa
          ? `Caixa de estoque. Os animais saem dela pela entrega, pela baixa ou passando para outra caixa; quando ela esvaziar, a posição fica vazia.`
          : descreverLiberacao(ficha.caixa.dtLiberacao, ficha.caixa.motivoLiberacao)}
      </div>

      <LadoALado>
        <Campo rotulo="Sexo">
          {SIMBOLO_DO_SEXO[sexo]} {ROTULO_DO_SEXO[sexo]}
        </Campo>
        <Campo rotulo="Linhagem">{ficha.caixa.linhagem ?? '—'}</Campo>
        <Campo rotulo="Idade hoje">{idadeDe(ficha.nascimentoDe, ficha.nascimentoAte)}</Campo>
      </LadoALado>

      <LadoALado>
        <Campo rotulo="Animais" destaque>
          {ficha.total}
        </Campo>
        <Campo rotulo="Reservados">{ficha.reservado}</Campo>
        <Campo rotulo="Livres">{ficha.livre}</Campo>
      </LadoALado>

      {acao === 'baixa' && (
        <BaixaNaCaixa caixa={caixa} grupos={grupos} aoTerminar={() => setAcao(null)} />
      )}
      {acao === 'mudanca' && (
        <MudarAnimais
          caixa={caixa}
          grupos={grupos}
          botao="Passar para outra caixa"
          aoTerminar={() => setAcao(null)}
        />
      )}
      {acao === 'entrada' && (
        <AcrescentarAnimais idCaixa={caixa.id} sexo={sexo} aoTerminar={() => setAcao(null)} />
      )}
      {acao === null && ativa && (
        <div className="ficha__botoes">
          {ficha.total > 0 && (
            <Botao variante="primario" onClick={() => setAcao('mudanca')}>
              Passar para outra caixa
            </Botao>
          )}
          <Botao onClick={() => setAcao('entrada')}>Acrescentar animais (cadastro inicial)</Botao>
          {ficha.total > 0 && (
            <Botao variante="perigo" onClick={() => setAcao('baixa')}>
              Registrar baixa
            </Botao>
          )}
        </div>
      )}

      <h3>Por idade</h3>
      {ficha.grupos.length === 0 ? (
        <p className="ficha__vazio">Nenhum animal na caixa.</p>
      ) : (
        <ul className="ficha__lista">
          {ficha.grupos.map((grupo) => (
            <li key={grupo.dtNascimento} className="fichaDoEstoque__grupo">
              <strong>
                Nascidos em {formatarData(grupo.dtNascimento)}, {descreverDias(grupo.idadeDias)}
              </strong>
              <span>
                {contarDoSexo(grupo.total, sexo)}: {reservadosDoSexo(grupo.reservados, sexo)} e{' '}
                {grupo.livres} {grupo.livres === 1 ? 'livre' : 'livres'}
              </span>
              <ul className="fichaDoEstoque__origens">
                {grupo.origens.map((origem) => (
                  <li key={origem.idParto}>
                    {origem.ordem === null || origem.casal === null
                      ? `Cadastro inicial: ${origem.qtd} ${origem.qtd === 1 ? 'animal' : 'animais'}`
                      : `${origem.qtd} do ${origem.ordem}º parto do casal ${origem.casal}, caixa ${origem.codigoOrigem ?? '—'} (${origem.numeroVisivelOrigem ?? '—'})`}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <h3>Reservados para</h3>
      {ficha.pedidos.length === 0 ? (
        <p className="ficha__vazio">Nenhum animal desta caixa está reservado.</p>
      ) : (
        <ul className="ficha__lista">
          {ficha.pedidos.map((pedido) => (
            <li key={pedido.idPedido}>
              <strong>Pedido #{pedido.idPedido}</strong> {contarDoSexo(pedido.qtd, sexo)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** "1º parto: nasceu em 24/09/2026, 5 M e 5 F; desmame em 16/10/2026, 4 M e 4 F" */
function descreverParto(parto: Parto): string {
  const ciclo = parto.dtPartoReal
    ? `nasceu em ${formatarData(parto.dtPartoReal)}, ${parto.nascidoM ?? 0} M e ${parto.nascidoF ?? 0} F`
    : parto.dtSemNinhada
      ? `fechado sem ninhada em ${formatarData(parto.dtSemNinhada)}`
      : `acasalado em ${formatarData(parto.dtAcasalamento)}`
  const desmame = parto.dtDesmameReal
    ? `; desmame em ${formatarData(parto.dtDesmameReal)}, ${parto.desmamadoM ?? 0} M e ${parto.desmamadoF ?? 0} F`
    : ''

  return `${parto.ordem}º parto: ${ciclo}${desmame}`
}

/** Os casais que a caixa teve antes de virar de estoque: só a história, sem ações */
function CasaisAnteriores({ casais }: { casais: CasalComPartos[] }) {
  return (
    <div className="ficha__aba">
      {casais.map(({ casal, partos }) => (
        <section key={casal.id} className="fichaDoEstoque__casal">
          <h3>
            Casal {casal.identificacao} · {casal.linhagem}
          </h3>
          <p className="ficha__dica">
            Acasalado em {formatarData(casal.dtFormacao)}
            {casal.dtEncerramento ? `, encerrado em ${formatarData(casal.dtEncerramento)}` : ''}.
          </p>
          <ul className="ficha__lista">
            {partos.map((parto) => (
              <li key={parto.id}>{descreverParto(parto)}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ------------------------------------------------------------ virar caixa de estoque

/**
 * A caixa do casal encerrado que ficou só com desmamados de um sexo pode virar caixa de estoque
 * ali mesmo, sem mudar os animais de lugar
 */
export function VirarCaixaDeEstoque({
  idCaixa,
  sexo,
  total,
}: {
  idCaixa: number
  sexo: Sexo
  total: number
}) {
  const { message, modal } = App.useApp()
  const virar = useVirarCaixaDeEstoque()

  function confirmar() {
    modal.confirm({
      title: 'Virar caixa de estoque?',
      content: `A caixa passa a ser a caixa de estoque destas ${contarDoSexo(total, sexo)} e sai da reprodução. Casal novo vai em outra posição.`,
      okText: 'Virar caixa de estoque',
      cancelText: 'Cancelar',
      onOk: () =>
        virar.mutateAsync(idCaixa).then(
          () => void message.success('A caixa virou caixa de estoque.'),
          (erro: Error) => void message.error(erro.message),
        ),
    })
  }

  return (
    <Aviso
      tom="informacao"
      titulo={`Sobraram na caixa só desmamados de um sexo: ${contarDoSexo(total, sexo)}`}
    >
      <p>Ela pode virar caixa de estoque aqui mesmo, sem mudar os animais de lugar.</p>
      <Botao onClick={confirmar} loading={virar.isPending}>
        Virar caixa de estoque
      </Botao>
    </Aviso>
  )
}
