import { EditOutlined } from '@ant-design/icons'
import { App, Form, InputNumber, Segmented, Select, Tooltip } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, CampoDeData, Janela } from '@/componentes'
import { ROTULO_DO_SEXO, SEXOS, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useCatalogo, useEditarCaixaDeEstoque } from '@/dominio/consultas'
import type { EdicaoDoEstoque } from '@/dominio/consultas'
import type { DataISO, FichaDeEstoque, OrigemDoGrupo, Sexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje, formatarData } from '@/lib/data'
import { LadoALado } from './CamposDaFicha'
import './LapisDaFicha.css'

/** Uma ninhada do cadastro inicial com animais na caixa: o nascimento e a quantidade se corrigem aqui */
interface NinhadaDoCadastro {
  idParto: number
  dtNascimento: DataISO
  /** a entrada no estoque: o nascimento não passa dela */
  dtEntrada: DataISO | null
  /** os vivos dela nesta caixa */
  qtd: number
  /** quantos entraram no cadastro: a quantidade que se corrige */
  cadastrados: number
}

interface CamposDoEstoque {
  idLinhagem: number
  sexo: Sexo
  /** a data e a quantidade de cada ninhada do cadastro inicial, na ordem delas */
  nascimentos?: { dtNascimento: DataISO }[]
  quantidades?: { quantidade: number }[]
}

/** Onde a ninhada está no formulário, para cada lista do corpo, que só leva as que mudaram */
type Indices = Record<'nascimentos' | 'quantidades', number[]>

const OPCOES_DE_SEXO = SEXOS.map((sexo) => ({
  value: sexo,
  label: `${SIMBOLO_DO_SEXO[sexo]} ${ROTULO_DO_SEXO[sexo]}`,
}))

const doCadastro = (origem: OrigemDoGrupo) => origem.ordem === null || origem.casal === null

/** As ninhadas do cadastro inicial e as origens de casal da caixa, do grupo mais velho ao mais novo */
function origensDaCaixa(ficha: FichaDeEstoque) {
  const cadastro: NinhadaDoCadastro[] = []
  const deCasal: OrigemDoGrupo[] = []

  for (const grupo of ficha.grupos) {
    for (const origem of grupo.origens) {
      if (doCadastro(origem)) {
        cadastro.push({
          idParto: origem.idParto,
          dtNascimento: grupo.dtNascimento,
          dtEntrada: origem.dtEntrada,
          qtd: origem.qtd,
          cadastrados: origem.cadastrados ?? origem.qtd,
        })
      } else {
        deCasal.push(origem)
      }
    }
  }

  return { cadastro, deCasal }
}

/** "3 do 1º parto do casal AB, caixa T1I", como a ficha diz a origem */
const descreverDoCasal = (origem: OrigemDoGrupo) =>
  `${origem.qtd} do ${origem.ordem}º parto do casal ${origem.casal}, caixa ${origem.codigoOrigem ?? '—'}`

/** Só o que mudou em relação à caixa gravada, com o lugar de cada ninhada no formulário */
function mudancas(
  ficha: FichaDeEstoque,
  cadastro: NinhadaDoCadastro[],
  campos: CamposDoEstoque,
): { corpo: EdicaoDoEstoque; indices: Indices } {
  const corpo: EdicaoDoEstoque = {}
  const indices: Indices = { nascimentos: [], quantidades: [] }

  if (campos.idLinhagem !== ficha.caixa.idLinhagem) corpo.idLinhagem = campos.idLinhagem
  if (campos.sexo !== ficha.caixa.sexo) corpo.sexo = campos.sexo

  // o formulário guarda a data e a quantidade de cada ninhada, na ordem delas
  const nascimentos = cadastro.flatMap(({ idParto, dtNascimento }, indice) => {
    const nova = campos.nascimentos?.[indice]?.dtNascimento ?? dtNascimento
    if (nova === dtNascimento) return []
    indices.nascimentos.push(indice)
    return [{ idParto, dtNascimento: nova }]
  })
  if (nascimentos.length > 0) corpo.nascimentos = nascimentos

  const quantidades = cadastro.flatMap(({ idParto, cadastrados }, indice) => {
    const nova = campos.quantidades?.[indice]?.quantidade ?? cadastrados
    if (nova === cadastrados) return []
    indices.quantidades.push(indice)
    return [{ idParto, quantidade: nova }]
  })
  if (quantidades.length > 0) corpo.quantidades = quantidades

  return { corpo, indices }
}

/**
 * O lápis no canto da ficha da caixa de estoque: abre o formulário com a linhagem, o sexo, e o
 * nascimento e a quantidade do que veio do cadastro inicial, para corrigir o que foi lançado errado.
 * A quantidade é como se acrescenta ou tira animal do cadastro depois que a caixa nasceu. Sem
 * motivo; quem recusa o que ficaria contraditório é a API
 */
export function EditarEstoque({ ficha }: { ficha: FichaDeEstoque }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Tooltip title="Editar caixa de estoque">
        <Botao
          variante="fantasma"
          className="lapis-da-ficha"
          aria-label="Editar caixa de estoque"
          icon={<EditOutlined aria-hidden="true" />}
          onClick={() => setAberto(true)}
        />
      </Tooltip>
      {aberto && <JanelaDoEstoque ficha={ficha} aoFechar={() => setAberto(false)} />}
    </>
  )
}

function JanelaDoEstoque({ ficha, aoFechar }: { ficha: FichaDeEstoque; aoFechar: () => void }) {
  const { message } = App.useApp()
  const catalogo = useCatalogo()
  const editar = useEditarCaixaDeEstoque()
  const [form] = Form.useForm<CamposDoEstoque>()
  const { cadastro, deCasal } = origensDaCaixa(ficha)
  const falha = useFalhaDoFormulario(form, [
    'idLinhagem',
    'sexo',
    ...cadastro.flatMap((_, indice) => [
      `nascimentos.${indice}.dtNascimento`,
      `quantidades.${indice}.quantidade`,
    ]),
  ])
  const { caixa } = ficha

  // as da espécie da caixa; a inativa só aparece se for a da caixa, para o nome dela não sumir
  const linhagens = (catalogo.data?.especies ?? [])
    .filter((e) => e.codigo === caixa.especie)
    .flatMap((e) => e.linhagens)
    .filter((l) => l.ativa || l.id === caixa.idLinhagem)
    .map((l) => ({ value: l.id, label: l.ativa ? l.nome : `${l.nome} (inativa)` }))

  function salvar(campos: CamposDoEstoque) {
    const { corpo, indices } = mudancas(ficha, cadastro, campos)
    if (Object.keys(corpo).length === 0) return aoFechar()

    falha.limpar()
    editar.mutateAsync({ idCaixa: caixa.id, ...corpo }).then(
      () => {
        void message.success(`Caixa ${caixa.endereco.codigo} salva.`)
        aoFechar()
      },
      // a API aponta o nascimento e a quantidade pelo lugar no corpo, que só leva os que mudaram
      (erro: Error) =>
        falha.mostrarComNomes(erro, (chave) => {
          const [, lista, posicao, campo] =
            /^(nascimentos|quantidades)\.(\d+)\.(\w+)$/.exec(chave) ?? []
          const indice =
            lista === undefined || posicao === undefined
              ? undefined
              : indices[lista as keyof Indices][Number(posicao)]
          return indice === undefined ? chave : `${lista}.${indice}.${campo}`
        }),
    )
  }

  return (
    <Janela
      open
      title={`Editar caixa de estoque ${caixa.endereco.codigo}`}
      okText="Salvar"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={editar.isPending}
      width={520}
    >
      <Form
        name="edicao-do-estoque"
        form={form}
        layout="vertical"
        onFinish={salvar}
        initialValues={{
          idLinhagem: caixa.idLinhagem ?? undefined,
          sexo: caixa.sexo,
          nascimentos: cadastro.map(({ dtNascimento }) => ({ dtNascimento })),
          quantidades: cadastro.map(({ cadastrados }) => ({ quantidade: cadastrados })),
        }}
      >
        {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
        <p className="lapis-da-ficha__dica">
          Para corrigir o que foi lançado errado, sobretudo no cadastro inicial. A linhagem e o sexo
          valem para a caixa e para os animais dela; o nascimento muda a idade da ninhada do
          cadastro inteira, também dos animais dela que estiverem em outra caixa. A quantidade é
          quantos entraram: subir acrescenta nesta caixa, descer tira só os vivos livres daqui.
        </p>
        <Form.Item
          name="idLinhagem"
          label="Linhagem"
          rules={[{ required: true, message: 'Escolha a linhagem' }]}
        >
          <Select options={linhagens} loading={catalogo.isPending} />
        </Form.Item>
        <Form.Item name="sexo" label="Sexo">
          <Segmented<Sexo> block options={OPCOES_DE_SEXO} />
        </Form.Item>
        {cadastro.map((ninhada, indice) => (
          <LadoALado key={ninhada.idParto}>
            <Form.Item
              name={['nascimentos', indice, 'dtNascimento']}
              label={`Nascimento do cadastro inicial (${ninhada.qtd} ${ninhada.qtd === 1 ? 'animal' : 'animais'})`}
              rules={[{ required: true, message: 'Data' }]}
              extra={
                ninhada.dtEntrada
                  ? `Entraram no estoque em ${formatarData(ninhada.dtEntrada)}: o nascimento não passa disso.`
                  : undefined
              }
            >
              <CampoDeData max={ateHoje(ninhada.dtEntrada)} />
            </Form.Item>
            <Form.Item
              name={['quantidades', indice, 'quantidade']}
              label="Quantidade"
              rules={[{ required: true, message: 'De 1 a 999' }]}
            >
              <InputNumber min={1} max={999} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </LadoALado>
        ))}
        {deCasal.length > 0 && (
          <div className="lapis-da-ficha__casais">
            <strong>Animais de casal nesta caixa</strong>
            <ul>
              {deCasal.map((origem) => (
                <li key={origem.idParto}>
                  {descreverDoCasal(origem)}: corrija pela ficha do casal.
                </li>
              ))}
            </ul>
          </div>
        )}
      </Form>
    </Janela>
  )
}
