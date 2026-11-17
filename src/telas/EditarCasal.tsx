import { EditOutlined } from '@ant-design/icons'
import { App, Form, Segmented, Select, Tabs, Tooltip } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, CampoDeData, Janela } from '@/componentes'
import { OPCOES_DE_GRUPO, OPCOES_DE_PARTO } from '@/dominio/caixa'
import { useCatalogo, useEditarCasal } from '@/dominio/consultas'
import type { EdicaoDoCasal } from '@/dominio/consultas'
import type { Casal, DataISO, FichaDeCasal } from '@/dominio/tipos'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje } from '@/lib/data'
import { AvisoDoCruzamento } from './AvisoDoCruzamento'
import { LadoALado } from './CamposDaFicha'
import { EditarParto } from './EditarParto'
import './LapisDaFicha.css'

interface CamposDaEdicao {
  idLinhagem: number
  grupoMacho: string
  grupoFemea: string
  dtFormacao: DataISO
  partoInicial: number
}

/** Onde a API pode apontar erro na edição: os mesmos nomes do corpo */
const CAMPOS_DA_EDICAO: (keyof CamposDaEdicao)[] = [
  'idLinhagem',
  'grupoMacho',
  'grupoFemea',
  'dtFormacao',
  'partoInicial',
]

/** Só o que mudou em relação ao casal gravado: a API grava e registra só isso */
function mudancas(casal: Casal, campos: CamposDaEdicao): EdicaoDoCasal {
  return Object.fromEntries(
    CAMPOS_DA_EDICAO.filter((campo) => campos[campo] !== casal[campo]).map((campo) => [
      campo,
      campos[campo],
    ]),
  )
}

/**
 * O lápis Editar no canto da ficha do casal: uma janela com a aba Casal (o que foi digitado na
 * formação) e uma aba por parto do casal (EditarParto), para corrigir o engano. Cada seção salva
 * sozinha, sem motivo, e a janela fica aberta: a ficha recarrega por trás com o que mudou
 */
export function EditarCasal({ casal, ficha }: { casal: Casal; ficha: FichaDeCasal }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Tooltip title="Editar">
        <Botao
          variante="fantasma"
          className="lapis-da-ficha"
          aria-label="Editar"
          icon={<EditOutlined aria-hidden="true" />}
          onClick={() => setAberto(true)}
        />
      </Tooltip>
      {aberto && <JanelaDeEdicao casal={casal} ficha={ficha} aoFechar={() => setAberto(false)} />}
    </>
  )
}

function JanelaDeEdicao({
  casal,
  ficha,
  aoFechar,
}: {
  casal: Casal
  ficha: FichaDeCasal
  aoFechar: () => void
}) {
  return (
    <Janela
      open
      title={`Editar casal ${casal.identificacao}`}
      footer={null}
      onCancel={aoFechar}
      width={640}
    >
      <Tabs
        items={[
          {
            key: 'casal',
            label: 'Casal',
            children: (
              // a ficha recarrega com o casal gravado: o formulário começa de novo com ele
              <FormularioDoCasal
                key={CAMPOS_DA_EDICAO.map((campo) => casal[campo]).join('|')}
                casal={casal}
                ficha={ficha}
              />
            ),
          },
          // os partos do casal da ficha, não os dos casais que vieram antes nela
          ...ficha.partos.map((parto) => ({
            key: `parto-${parto.id}`,
            label: `${parto.ordem}º parto`,
            children: <EditarParto ficha={ficha} casal={casal} parto={parto} />,
          })),
        ]}
      />
    </Janela>
  )
}

/** O que foi digitado na formação. Sem motivo; quem recusa o que ficaria contraditório é a API */
function FormularioDoCasal({ casal, ficha }: { casal: Casal; ficha: FichaDeCasal }) {
  const { message } = App.useApp()
  const catalogo = useCatalogo()
  const editar = useEditarCasal()
  const [form] = Form.useForm<CamposDaEdicao>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_EDICAO)

  // as da espécie da caixa; a inativa só aparece se for a do casal, para o nome dela não sumir
  const linhagens = (catalogo.data?.especies ?? [])
    .filter((e) => e.codigo === ficha.caixa.especie)
    .flatMap((e) => e.linhagens)
    .filter((l) => l.ativa || l.id === casal.idLinhagem)
    .map((l) => ({ value: l.id, label: l.ativa ? l.nome : `${l.nome} (inativa)` }))

  function salvar(campos: CamposDaEdicao) {
    const corpo = mudancas(casal, campos)
    if (Object.keys(corpo).length === 0) return

    falha.limpar()
    editar.mutateAsync({ idCasal: casal.id, ...corpo }).then(
      () => void message.success(`Casal ${campos.grupoMacho}${campos.grupoFemea} salvo.`),
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name="edicao-do-casal"
      form={form}
      layout="vertical"
      onFinish={salvar}
      initialValues={{
        idLinhagem: casal.idLinhagem,
        grupoMacho: casal.grupoMacho,
        grupoFemea: casal.grupoFemea,
        dtFormacao: casal.dtFormacao,
        partoInicial: casal.partoInicial,
      }}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <p className="lapis-da-ficha__dica">
        Para corrigir o que foi digitado errado. A linhagem muda também nos partos e nos animais
        deste casal, a data de formação leva junto o acasalamento do 1º parto, e o parto em que ele
        entrou renumera os partos. O que foi registrado em cada parto se corrige na aba dele.
      </p>
      <Form.Item
        name="idLinhagem"
        label="Linhagem"
        rules={[{ required: true, message: 'Escolha a linhagem' }]}
      >
        <Select options={linhagens} loading={catalogo.isPending} />
      </Form.Item>
      <LadoALado>
        <Form.Item
          name="grupoMacho"
          label="Grupo do macho (A-E)"
          rules={[{ required: true, message: 'Grupo do macho' }]}
        >
          <Select options={OPCOES_DE_GRUPO} />
        </Form.Item>
        <Form.Item
          name="grupoFemea"
          label="Grupo da fêmea (A-E)"
          rules={[{ required: true, message: 'Grupo da fêmea' }]}
        >
          <Select options={OPCOES_DE_GRUPO} />
        </Form.Item>
      </LadoALado>
      <AvisoDoCruzamento form={form} />
      <Form.Item
        name="dtFormacao"
        label="Data de formação"
        rules={[{ required: true, message: 'Data' }]}
      >
        <CampoDeData max={ateHoje()} />
      </Form.Item>
      <Form.Item
        name="partoInicial"
        label="Parto em que entrou no Nidus"
        extra="Se o casal já tinha partos antes do Nidus, o parto em que ele estava no cadastro"
      >
        <Segmented<number> options={OPCOES_DE_PARTO} />
      </Form.Item>
      <div className="ficha__botoes">
        <Botao variante="primario" htmlType="submit" loading={editar.isPending}>
          Salvar
        </Botao>
      </div>
    </Form>
  )
}
