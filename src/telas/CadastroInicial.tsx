// O cadastro inicial da colônia: animais que já existiam antes do Nidus, de idade conhecida e casal
// desconhecido. Uma caixa de estoque nova numa posição vazia, ou mais animais numa caixa de
// estoque que já existe
import { App, Form, InputNumber, Segmented, Select } from 'antd'
import { Aviso, Botao, CampoDeData } from '@/componentes'
import { contarDoSexo, ROTULO_DO_SEXO, SEXOS, SIMBOLO_DO_SEXO } from '@/dominio/caixa'
import { useCatalogo, useEntradaNaCaixa, useNovaCaixaDeEstoque } from '@/dominio/consultas'
import type { DataISO, PosicaoNaEstante, Sexo } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { descreverDias, haDias, hoje, idadeEmDias } from '@/lib/data'
import { LadoALado } from './CamposDaFicha'

/** O animal só entra no cadastro inicial desmamado: a API recusa nascimento com menos dias */
export const IDADE_MINIMA_DIAS = 21

const QUANTIDADE = {
  controls: false,
  precision: 0,
  min: 1,
  max: 999,
  inputMode: 'numeric',
} as const

const OPCOES_DE_SEXO = SEXOS.map((sexo) => ({
  value: sexo,
  label: `${SIMBOLO_DO_SEXO[sexo]} ${ROTULO_DO_SEXO[sexo]}`,
}))

/** "35 dias hoje", ao lado do campo de nascimento */
function IdadeHoje({ nascimento }: { nascimento: DataISO | undefined }) {
  if (!nascimento) return null
  const dias = idadeEmDias(nascimento, hoje())
  if (dias < 0) return null

  return <span>{descreverDias(dias)} hoje</span>
}

interface CamposDaCaixa {
  idLinhagem: number
  sexo: Sexo
  quantidade: number
  dtNascimento: DataISO
}

const CAMPOS_DA_CAIXA: (keyof CamposDaCaixa)[] = [
  'idLinhagem',
  'sexo',
  'quantidade',
  'dtNascimento',
]

/** Caixa de estoque nova na posição vazia: a caixa nasce com os animais */
export function NovaCaixaDeEstoque({
  posicao,
  aoCriar,
}: {
  posicao: PosicaoNaEstante
  aoCriar: (idCaixa: number) => void
}) {
  const { message } = App.useApp()
  const catalogo = useCatalogo()
  const criar = useNovaCaixaDeEstoque()
  const [form] = Form.useForm<CamposDaCaixa>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_CAIXA)
  const nascimento = Form.useWatch('dtNascimento', form)

  const linhagens = (catalogo.data?.especies ?? []).map((e) => ({
    label: e.nome,
    options: e.linhagens.filter((l) => l.ativa).map((l) => ({ value: l.id, label: l.nome })),
  }))

  function salvar(campos: CamposDaCaixa) {
    falha.limpar()
    const { idEstante, face, linha, coluna } = posicao
    criar
      .mutateAsync({
        posicao: { idEstante, face, linha, coluna },
        idLinhagem: campos.idLinhagem,
        sexo: campos.sexo,
        quantidade: campos.quantidade,
        dtNascimento: campos.dtNascimento,
      })
      .then(
        ({ idCaixa, codigo }) => {
          void message.success(`Caixa ${codigo} cadastrada.`)
          aoCriar(idCaixa)
        },
        (erro: Error) => falha.mostrar(erro),
      )
  }

  return (
    <Form
      name="estoque"
      form={form}
      layout="vertical"
      onFinish={salvar}
      initialValues={{ sexo: 'M' satisfies Sexo }}
      className="ficha__formulario"
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <Form.Item
        name="idLinhagem"
        label="Linhagem"
        rules={[{ required: true, message: 'Escolha a linhagem' }]}
      >
        <Select
          options={linhagens}
          loading={catalogo.isPending}
          placeholder="Selecione a linhagem"
        />
      </Form.Item>
      <LadoALado>
        <Form.Item name="sexo" label="Sexo" rules={[{ required: true, message: 'Sexo' }]}>
          <Segmented<Sexo> options={OPCOES_DE_SEXO} />
        </Form.Item>
        <Form.Item
          name="quantidade"
          label="Quantidade"
          rules={[{ required: true, message: 'De 1 a 999' }]}
        >
          <InputNumber {...QUANTIDADE} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="dtNascimento"
          label="Data de nascimento"
          extra={<IdadeHoje nascimento={nascimento} />}
          rules={[{ required: true, message: 'Data' }]}
        >
          <CampoDeData max={haDias(IDADE_MINIMA_DIAS)} />
        </Form.Item>
      </LadoALado>
      <p className="ficha__dica">
        Só animais desmamados: o nascimento tem de ser de pelo menos {IDADE_MINIMA_DIAS} dias atrás.
      </p>
      <Botao variante="primario" htmlType="submit" loading={criar.isPending}>
        Cadastrar caixa de estoque
      </Botao>
    </Form>
  )
}

interface CamposDaEntrada {
  quantidade: number
  dtNascimento: DataISO
}

/** Mais animais do cadastro inicial na caixa de estoque: sexo e linhagem vêm da caixa */
export function AcrescentarAnimais({
  idCaixa,
  sexo,
  aoTerminar,
}: {
  idCaixa: number
  sexo: Sexo
  aoTerminar: () => void
}) {
  const { message } = App.useApp()
  const entrada = useEntradaNaCaixa()
  const [form] = Form.useForm<CamposDaEntrada>()
  const falha = useFalhaDoFormulario(form, ['quantidade', 'dtNascimento'])
  const nascimento = Form.useWatch('dtNascimento', form)

  function salvar(campos: CamposDaEntrada) {
    falha.limpar()
    entrada.mutateAsync({ idCaixa, ...campos }).then(
      () => {
        void message.success(`${contarDoSexo(campos.quantidade, sexo)} acrescentados.`)
        aoTerminar()
      },
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name="entrada"
      form={form}
      layout="vertical"
      onFinish={salvar}
      className="ficha__formulario"
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        <Form.Item
          name="quantidade"
          label="Quantidade"
          rules={[{ required: true, message: 'De 1 a 999' }]}
        >
          <InputNumber {...QUANTIDADE} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="dtNascimento"
          label="Data de nascimento"
          extra={<IdadeHoje nascimento={nascimento} />}
          rules={[{ required: true, message: 'Data' }]}
        >
          <CampoDeData max={haDias(IDADE_MINIMA_DIAS)} />
        </Form.Item>
      </LadoALado>
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={entrada.isPending}>
          Acrescentar
        </Botao>
        <Botao variante="fantasma" onClick={aoTerminar}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}
