import { PlusOutlined } from '@ant-design/icons'
import { App, Form, Input, Select } from 'antd'
import { useState } from 'react'
import type { AriaAttributes } from 'react'
import { Aviso, Botao, Janela, Texto } from '@/componentes'
import { useEstantes, useFormatos, useGrade, useSalas, useSalvarEstante } from '@/dominio/consultas'
import type { DadosDaEstante } from '@/dominio/consultas'
import { caixasNaGrade, porQueNaoRemove, proximoNumeroDeEstante } from '@/dominio/estante'
import {
  avisoDaTraseira,
  avisoDasCaixasFora,
  caixasForaDoFormato,
  descreverFormato,
} from '@/dominio/formato'
import type { Medidas } from '@/dominio/formato'
import type { Estante } from '@/dominio/tipos'
import { motivoDaFalha, useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { useTelaEstreita } from '@/layout/useTelaEstreita'
import { FormularioDoFormato } from './FormatosDeEstante'
import { MiniaturaDaEstante } from './MiniaturaDaEstante'
import './FormularioDaEstante.css'

const CAMPOS_DA_ESTANTE: (keyof DadosDaEstante)[] = ['idSala', 'idFormato', 'numeroVisivel']

/**
 * O cadastro e a edição da estante: a sala, o formato e o número. O formato muda também depois do
 * cadastro, desde que nenhuma caixa fique fora dele; trocar as colunas muda as letras da traseira.
 * Na edição, a estante vazia sai pelo Remover estante
 */
export function FormularioDaEstante({
  estante,
  aoFechar,
}: {
  estante: Estante | null
  aoFechar: () => void
}) {
  const { message, modal } = App.useApp()
  const salas = useSalas()
  const estantes = useEstantes()
  const formatos = useFormatos()
  // as caixas da estante: as que ficariam fora do formato escolhido, e se ela pode sair
  const grade = useGrade(estante?.id ?? null)
  const salvar = useSalvarEstante()
  const [form] = Form.useForm<DadosDaEstante>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DA_ESTANTE)
  const estreita = useTelaEstreita()

  // a sala e o número sugeridos saem das listas quando o formulário abre: quem abre espera elas
  // chegarem (a tela das estantes desabilita o Nova estante até lá)
  const inicial = estante
    ? { idSala: estante.idSala, idFormato: estante.idFormato, numeroVisivel: estante.numeroVisivel }
    : {
        idSala: salas.data?.[0]?.id,
        idFormato: formatos.data?.[0]?.id,
        numeroVisivel: proximoNumeroDeEstante(estantes.data ?? []),
      }
  const idFormato = Form.useWatch('idFormato', form) ?? inicial.idFormato
  // o formato da lista; enquanto ela carrega, o da estante, que vem com as medidas dele
  const medidas: Medidas | null =
    formatos.data?.find((formato) => formato.id === idFormato) ??
    (estante && idFormato === estante.idFormato ? estante : null)
  const fora = estante && grade.data && medidas ? caixasForaDoFormato(grade.data, medidas) : []
  const traseira = estante && medidas ? avisoDaTraseira(estante, medidas) : null
  // null enquanto a grade carrega: aí não dá para saber se a estante está vazia
  const caixas = estante && grade.data ? caixasNaGrade(grade.data) : null

  function enviar(campos: DadosDaEstante) {
    // com caixa de fora o Salvar fica desabilitado, e o envio que chegar por outro caminho para aqui
    if (fora.length > 0) return

    const numeroVisivel = campos.numeroVisivel.trim()
    const aviso = (texto: string) => ({
      onSuccess: () => {
        void message.success(texto)
        aoFechar()
      },
      onError: falha.mostrar,
    })

    falha.limpar()
    if (!estante) {
      salvar.mutate(
        {
          tipo: 'criar',
          dados: { idSala: campos.idSala, idFormato: campos.idFormato, numeroVisivel },
        },
        aviso(`Estante ${numeroVisivel} cadastrada.`),
      )
      return
    }

    // só o que mudou, ao menos um
    const dados: Partial<DadosDaEstante> = {
      ...(campos.idSala === estante.idSala ? {} : { idSala: campos.idSala }),
      ...(campos.idFormato === estante.idFormato ? {} : { idFormato: campos.idFormato }),
      ...(numeroVisivel === estante.numeroVisivel ? {} : { numeroVisivel }),
    }
    if (Object.keys(dados).length === 0) return aoFechar()

    salvar.mutate(
      { tipo: 'alterar', id: estante.id, dados },
      aviso(`Estante ${numeroVisivel} salva.`),
    )
  }

  function remover(estante: Estante) {
    void modal.confirm({
      title: `Remover a estante ${estante.numeroVisivel}?`,
      content: `Ela sai da grade da ${estante.sala}. Só dá para remover a estante vazia, sem caixa em nenhuma posição.`,
      okText: 'Remover',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () =>
        salvar.mutateAsync({ tipo: 'remover', id: estante.id }).then(
          () => {
            void message.success(`Estante ${estante.numeroVisivel} removida.`)
            aoFechar()
          },
          (erro: Error) => void message.error(motivoDaFalha(erro)),
        ),
    })
  }

  // só a estante vazia sai; com caixa, o botão fica desabilitado e o título diz quantas tem
  const removerEstante = estante && (
    <Botao
      variante="perigo"
      disabled={caixas !== 0}
      {...(caixas ? { title: porQueNaoRemove(caixas) } : {})}
      onClick={() => remover(estante)}
    >
      Remover estante
    </Botao>
  )

  return (
    <Janela
      open
      title={estante ? `Editar estante · ${estante.numeroVisivel}` : 'Nova estante'}
      okText={estante ? 'Salvar' : 'Cadastrar estante'}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={aoFechar}
      confirmLoading={salvar.isPending}
      okButtonProps={{ disabled: fora.length > 0 }}
      // no computador o Remover estante fica à esquerda do rodapé, longe do Salvar
      footer={(botoes) =>
        removerEstante && !estreita ? (
          <div className="formularioDaEstante__rodape">
            {removerEstante}
            <div className="formularioDaEstante__botoes">{botoes}</div>
          </div>
        ) : (
          botoes
        )
      }
    >
      <Form form={form} name="estante" layout="vertical" onFinish={enviar} initialValues={inicial}>
        {falha.erro && (
          <div className="formularioDaEstante__avisos">
            <Aviso tom="erro" titulo={falha.erro} />
          </div>
        )}
        <Form.Item
          name="idSala"
          label="Sala"
          rules={[{ required: true, message: 'Escolha a sala' }]}
        >
          <Select
            options={(salas.data ?? []).map((sala) => ({ value: sala.id, label: sala.nome }))}
            loading={salas.isPending}
            notFoundContent="Cadastre uma sala antes"
          />
        </Form.Item>
        <Form.Item
          name="idFormato"
          label="Formato"
          rules={[{ required: true, message: 'Escolha o formato' }]}
        >
          <CampoDoFormato estante={estante} />
        </Form.Item>
        {(fora.length > 0 || traseira) && (
          <div className="formularioDaEstante__avisos">
            {fora.length > 0 && <Aviso tom="erro" titulo={avisoDasCaixasFora(fora)} />}
            {traseira && <Aviso tom="informacao" titulo={traseira} />}
          </div>
        )}
        {medidas && (
          <div className="formularioDaEstante__miniatura">
            <MiniaturaDaEstante medidas={medidas} grade={estante ? grade.data : undefined} />
          </div>
        )}
        <Form.Item
          name="numeroVisivel"
          label="Número da estante"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Informe o número, como está na etiqueta. ex: E-05',
            },
          ]}
        >
          <Input placeholder="E-05" maxLength={30} />
        </Form.Item>
      </Form>
      {/* no celular o Remover estante sai do rodapé: lá ele ficaria colado no Cancelar, onde o
          dedo erra fácil. Vai para o fim da janela, com o motivo à vista quando não dá */}
      {removerEstante && estreita && (
        <div className="formularioDaEstante__remover">
          {removerEstante}
          {caixas ? <Texto tom="secundario">{porQueNaoRemove(caixas)}</Texto> : null}
        </div>
      )}
    </Janela>
  )
}

/** O valor da opção que, em vez de escolher um formato, abre o formulário do formato novo */
const NOVO_FORMATO = 'novo'

/**
 * A escolha do formato, com "Novo formato" no fim da lista: ele abre o formulário do formato por
 * cima, e o formato cadastrado já fica escolhido. É um campo de formulário: o Form.Item dá o valor
 * e recebe a mudança
 */
function CampoDoFormato({
  estante,
  value,
  onChange,
  ...resto
}: AriaAttributes & {
  /** na edição, o formato da estante entra na lista enquanto ela carrega, para o campo não mostrar o número */
  estante: Estante | null
  value?: number | undefined
  onChange?: ((idFormato: number) => void) | undefined
  id?: string
}) {
  const formatos = useFormatos()
  const [criando, setCriando] = useState(false)
  const lista = formatos.data ?? []
  const daEstante =
    estante && !lista.some((formato) => formato.id === estante.idFormato)
      ? [
          {
            value: estante.idFormato,
            label: descreverFormato({
              nome: estante.formato,
              faces: estante.faces,
              linhas: estante.linhas,
              colunas: estante.colunas,
            }),
          },
        ]
      : []

  return (
    <>
      <Select<number | typeof NOVO_FORMATO>
        {...resto}
        value={value ?? null}
        loading={formatos.isPending}
        onChange={(escolha) => (escolha === NOVO_FORMATO ? setCriando(true) : onChange?.(escolha))}
        options={[
          ...daEstante,
          ...lista.map((formato) => ({ value: formato.id, label: descreverFormato(formato) })),
          {
            value: NOVO_FORMATO,
            label: (
              <span className="formularioDaEstante__novoFormato">
                <PlusOutlined aria-hidden="true" />
                Novo formato
              </span>
            ),
          },
        ]}
      />
      {criando && (
        <FormularioDoFormato
          formato={null}
          aoFechar={() => setCriando(false)}
          aoSalvar={(novo) => onChange?.(novo.id)}
        />
      )}
    </>
  )
}
