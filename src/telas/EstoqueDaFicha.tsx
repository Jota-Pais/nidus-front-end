// A caixa de estoque na ficha. Depois do desmame os filhotes saem da caixa do casal para caixas de
// estoque, cada uma com um sexo e uma linhagem; qualquer posição vazia vira uma. Aqui ficam a
// ficha da caixa de estoque, os desmamados do parto com o "Passar para o estoque", e a caixa do
// casal encerrado que vira de estoque no lugar
import { App, Form, InputNumber, Select } from 'antd'
import { useState } from 'react'
import { Aviso, Botao } from '@/componentes'
import { COLUNA, contarDoSexo, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import {
  useDestinosDoEstoque,
  useEstantes,
  useGrade,
  usePassarParaOEstoque,
  useVirarCaixaDeEstoque,
} from '@/dominio/consultas'
import type { DestinoDoEstoque, PassagemParaOEstoque } from '@/dominio/consultas'
import type { CaixaDeEstoqueDestino, Face, FichaDeEstoque, Parto, Sexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { descreverDias, formatarData, idadeEmDias } from '@/lib/data'
import { Campo, LadoALado } from './CamposDaFicha'

/** "28 dias", ou "25 a 31 dias" quando as idades são diferentes */
function idadeDe(nascimentoDe: string | null, nascimentoAte: string | null): string {
  if (!nascimentoDe || !nascimentoAte) return '—'

  const maisVelho = idadeEmDias(nascimentoDe)
  const maisNovo = idadeEmDias(nascimentoAte)

  return maisVelho === maisNovo
    ? descreverDias(maisVelho)
    : `${maisNovo} a ${descreverDias(maisVelho)}`
}

const ROTULO_DO_SEXO: Record<Sexo, string> = { M: 'Machos', F: 'Fêmeas' }

// ------------------------------------------------------------ a ficha da caixa de estoque

export function FichaDoEstoque({ ficha }: { ficha: FichaDeEstoque }) {
  const { caixa } = ficha
  const enviada = caixa.estado === 'enviado'

  return (
    <div className="ficha__aba">
      <div className="ficha__casal">
        {enviada
          ? 'Caixa de estoque enviada: a entrega levou os últimos animais e a posição ficou livre.'
          : `Caixa de estoque · ${COLUNA[caixa.estado].legenda}. Os animais saem dela na entrega; quando ela esvaziar, a posição fica livre.`}
      </div>

      <LadoALado>
        <Campo rotulo="Sexo">
          {SIMBOLO_DO_SEXO[caixa.sexo]} {ROTULO_DO_SEXO[caixa.sexo]}
        </Campo>
        <Campo rotulo="Linhagem">{caixa.linhagem ?? '—'}</Campo>
        <Campo rotulo="Idade hoje">{idadeDe(ficha.nascimentoDe, ficha.nascimentoAte)}</Campo>
      </LadoALado>

      <LadoALado>
        <Campo rotulo="Animais" destaque>
          {ficha.total}
        </Campo>
        <Campo rotulo="Reservados">{ficha.reservado}</Campo>
        <Campo rotulo="Livres">{ficha.livre}</Campo>
      </LadoALado>

      <h3>De onde vieram</h3>
      {ficha.lotes.length === 0 ? (
        <p className="ficha__vazio">Nenhum animal na caixa.</p>
      ) : (
        <ul className="ficha__lotes">
          {ficha.lotes.map((lote) => (
            <li key={lote.idParto}>
              <strong>{contarDoSexo(lote.qtd, caixa.sexo)}</strong>
              <span>
                {lote.ordem}º parto do casal {lote.casal}, caixa {lote.origem.codigo} (
                {lote.origem.numeroVisivel})
              </span>
              <span>
                {lote.dtNascimento
                  ? `nascidos em ${formatarData(lote.dtNascimento)}, ${descreverDias(lote.idadeDias ?? 0)}`
                  : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Reservados para</h3>
      {ficha.pedidos.length === 0 ? (
        <p className="ficha__vazio">Nenhum animal desta caixa está reservado.</p>
      ) : (
        <ul className="ficha__lotes">
          {ficha.pedidos.map((pedido) => (
            <li key={pedido.idSolicitacao}>
              <strong>Pedido #{pedido.idSolicitacao}</strong>
              <span>{contarDoSexo(pedido.qtd, caixa.sexo)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ------------------------------------------------------------ os desmamados do parto

/** Onde estão os desmamados do parto, e o formulário que tira da caixa do casal para o estoque */
export function DesmamadosDoParto({ idCaixa, parto }: { idCaixa: number; parto: Parto }) {
  const [aberto, setAberto] = useState(false)
  const { naCaixa, noEstoque } = parto
  const sobrou = naCaixa.m + naCaixa.f > 0

  return (
    <>
      <h3>Para onde foram</h3>
      <LadoALado>
        <Campo rotulo="Na caixa do casal" destaque={sobrou}>
          {naCaixa.m} M · {naCaixa.f} F
        </Campo>
        <Campo rotulo="No estoque">
          {noEstoque.length === 0
            ? '—'
            : noEstoque
                .map(
                  (caixa) =>
                    `${SIMBOLO_DO_SEXO[caixa.sexo]} ${caixa.qtd} em ${caixa.codigo} (${caixa.numeroVisivel})`,
                )
                .join(' · ')}
        </Campo>
      </LadoALado>

      {sobrou &&
        (aberto ? (
          <PassarParaOEstoque idCaixa={idCaixa} parto={parto} aoTerminar={() => setAberto(false)} />
        ) : (
          <div>
            <Botao variante="primario" onClick={() => setAberto(true)}>
              Passar para o estoque
            </Botao>
          </div>
        ))}
    </>
  )
}

/** O valor do destino no formulário: uma caixa de estoque (o id) ou 'nova', numa posição vazia */
type EscolhaDeDestino = number | 'nova'

interface CamposDaPassagem {
  qtdM?: number
  destinoM?: EscolhaDeDestino
  estanteM?: number
  posicaoM?: string
  qtdF?: number
  destinoF?: EscolhaDeDestino
  estanteF?: number
  posicaoF?: string
}

/** Onde a API pode apontar erro */
const CAMPOS_DA_PASSAGEM = ['qtdM', 'destinoM', 'qtdF', 'destinoF']

function PassarParaOEstoque({
  idCaixa,
  parto,
  aoTerminar,
}: {
  idCaixa: number
  parto: Parto
  aoTerminar: () => void
}) {
  const { message } = App.useApp()
  const passar = usePassarParaOEstoque(idCaixa)
  const destinos = useDestinosDoEstoque(parto.id)
  const [form] = Form.useForm<CamposDaPassagem>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_PASSAGEM)
  const sexos = (['M', 'F'] as const).filter(
    (sexo) => (sexo === 'M' ? parto.naCaixa.m : parto.naCaixa.f) > 0,
  )

  function destinoDe(sexo: Sexo, campos: CamposDaPassagem): DestinoDoEstoque {
    const escolha = campos[`destino${sexo}`]
    if (typeof escolha === 'number') return { idCaixa: escolha }

    const [face, linha, coluna] = (campos[`posicao${sexo}`] ?? '').split(':')
    return {
      posicao: {
        idEstante: campos[`estante${sexo}`] ?? 0,
        face: face as Face,
        linha: Number(linha),
        coluna: Number(coluna),
      },
    }
  }

  function salvar(campos: CamposDaPassagem) {
    falha.limpar()
    const pedido: PassagemParaOEstoque = { idParto: parto.id }

    for (const sexo of sexos) {
      const qtd = campos[`qtd${sexo}`] ?? 0
      if (qtd === 0) continue
      pedido[sexo === 'M' ? 'machos' : 'femeas'] = { qtd, destino: destinoDe(sexo, campos) }
    }

    if (!pedido.machos && !pedido.femeas) {
      falha.mostrar(new Error('Informe quantos animais passam para o estoque.'))
      return
    }

    // mutateAsync, e não o retorno do mutate: quando todos saem da caixa do casal, a ficha
    // recarregada já não mostra este formulário, e o React Query não chama o retorno do mutate
    // de quem saiu da tela
    passar.mutateAsync(pedido).then(({ caixas }) => {
      const feitas = caixas.map(
        (caixa) => `${contarDoSexo(caixa.qtd, caixa.sexo)} para a caixa de estoque ${caixa.codigo}`,
      )
      void message.success(`${feitas.join(' e ')}.`)
      aoTerminar()
    }, falha.mostrar)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={salvar}
      initialValues={{ qtdM: parto.naCaixa.m, qtdF: parto.naCaixa.f }}
      className="ficha__formulario"
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      {sexos.map((sexo) => (
        <DestinoDoSexo
          key={sexo}
          sexo={sexo}
          maximo={sexo === 'M' ? parto.naCaixa.m : parto.naCaixa.f}
          caixas={(sexo === 'M' ? destinos.data?.machos : destinos.data?.femeas) ?? []}
          carregando={destinos.isPending}
        />
      ))}
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={passar.isPending}>
          Passar para o estoque
        </Botao>
        <Botao variante="fantasma" onClick={aoTerminar}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}

/** Quantos animais de um sexo passam, e para qual caixa de estoque ou posição vazia */
function DestinoDoSexo({
  sexo,
  maximo,
  caixas,
  carregando,
}: {
  sexo: Sexo
  maximo: number
  caixas: CaixaDeEstoqueDestino[]
  carregando: boolean
}) {
  const form = Form.useFormInstance<CamposDaPassagem>()
  const destino = Form.useWatch(`destino${sexo}`, form)
  const qtd = Form.useWatch(`qtd${sexo}`, form)
  const estante = Form.useWatch(`estante${sexo}`, form)
  const opcoes = [
    ...caixas.map((caixa) => ({
      value: caixa.idCaixa as EscolhaDeDestino,
      label: `${caixa.codigo} (${caixa.numeroVisivel}): ${contarDoSexo(caixa.total, sexo)}, ${idadeDe(caixa.nascimentoDe, caixa.nascimentoAte)}`,
    })),
    { value: 'nova' as EscolhaDeDestino, label: 'Nova caixa numa posição vazia' },
  ]

  return (
    <>
      <LadoALado>
        <Form.Item
          name={`qtd${sexo}`}
          label={`${SIMBOLO_DO_SEXO[sexo]} ${ROTULO_DO_SEXO[sexo]} (até ${maximo})`}
          rules={[{ required: true, message: 'Quantos' }]}
        >
          <InputNumber min={0} max={maximo} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name={`destino${sexo}`}
          label="Para"
          rules={[{ required: (qtd ?? 0) > 0, message: 'Escolha a caixa de estoque' }]}
        >
          <Select
            options={opcoes}
            loading={carregando}
            placeholder={
              caixas.length > 0
                ? 'Caixa de estoque ou posição vazia'
                : 'Nova caixa numa posição vazia'
            }
            disabled={(qtd ?? 0) === 0}
          />
        </Form.Item>
      </LadoALado>
      {destino === 'nova' && (qtd ?? 0) > 0 && (
        <LadoALado>
          <Form.Item
            name={`estante${sexo}`}
            label="Estante"
            rules={[{ required: true, message: 'Escolha a estante' }]}
          >
            <EstantesDaPosicao aoTrocar={() => form.setFieldValue(`posicao${sexo}`, undefined)} />
          </Form.Item>
          <Form.Item
            name={`posicao${sexo}`}
            label="Posição vazia"
            rules={[{ required: true, message: 'Escolha a posição' }]}
          >
            <PosicoesVazias idEstante={estante ?? null} sexo={sexo} />
          </Form.Item>
        </LadoALado>
      )}
    </>
  )
}

function EstantesDaPosicao({
  value,
  onChange,
  aoTrocar,
}: {
  value?: number
  onChange?: (id: number) => void
  aoTrocar: () => void
}) {
  const estantes = useEstantes()

  return (
    <Select
      {...(value === undefined ? {} : { value })}
      loading={estantes.isPending}
      placeholder="Selecione a estante"
      options={(estantes.data ?? []).map((estante) => ({
        value: estante.id,
        label: `${estante.sala} · ${estante.numeroVisivel}`,
      }))}
      onChange={(id: number) => {
        onChange?.(id)
        aoTrocar()
      }}
    />
  )
}

/** As posições vazias da estante escolhida; antes da escolha, o campo espera */
function PosicoesVazias({
  idEstante,
  sexo,
  value,
  onChange,
}: {
  idEstante: number | null
  sexo: Sexo
  value?: string
  onChange?: (posicao: string) => void
}) {
  if (idEstante === null) return <Select disabled placeholder="Escolha a estante" />

  return (
    <PosicoesDaEstante
      idEstante={idEstante}
      sexo={sexo}
      {...(value === undefined ? {} : { value })}
      {...(onChange ? { onChange } : {})}
    />
  )
}

/** A posição que o outro sexo já escolheu na mesma estante fica de fora */
function PosicoesDaEstante({
  idEstante,
  sexo,
  value,
  onChange,
}: {
  idEstante: number
  sexo: Sexo
  value?: string
  onChange?: (posicao: string) => void
}) {
  const form = Form.useFormInstance<CamposDaPassagem>()
  const outro: Sexo = sexo === 'M' ? 'F' : 'M'
  const estanteDoOutro = Form.useWatch(`estante${outro}`, form)
  const posicaoDoOutro = Form.useWatch(`posicao${outro}`, form)
  const grade = useGrade(idEstante)

  const vazias = (grade.data?.faces ?? []).flatMap((face) =>
    face.posicoes
      .filter((posicao) => posicao.caixa === null)
      .map((posicao) => ({
        value: `${face.face}:${posicao.linha}:${posicao.coluna}`,
        label: posicao.codigo,
      }))
      .filter((opcao) => !(estanteDoOutro === idEstante && opcao.value === posicaoDoOutro)),
  )

  return (
    <Select
      {...(value === undefined ? {} : { value })}
      loading={grade.isPending}
      placeholder={grade.isPending || vazias.length > 0 ? 'Selecione a posição' : 'Estante cheia'}
      disabled={!grade.isPending && vazias.length === 0}
      showSearch
      options={vazias}
      {...(onChange ? { onChange } : {})}
    />
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
