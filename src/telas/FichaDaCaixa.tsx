import { App, Form, Input, Modal, Select, Tabs } from 'antd'
import { useState } from 'react'
import { Aviso, Botao, CampoDeData, Etiqueta, Linha, Texto } from '@/componentes'
import { COR_DO_PARTO } from '@/app/tokens'
import {
  corDoParto,
  descreverLiberacao,
  doSexo,
  idDaLinhagem,
  MAX_PARTOS_POR_CASAL,
  partosDaCaixa,
  SIMBOLO_DO_SEXO,
  vivosNaCaixa,
} from '@/dominio/caixa'
import { useCatalogo, useFicha, useFormarCasal, useRegistrarNaFicha } from '@/dominio/consultas'
import type { CasalNovo } from '@/dominio/consultas'
import type { Casal, CodigoEspecie, DataISO, FichaDeCasal, Parto } from '@/dominio/tipos'
import { EstadoDaConsulta } from '@/layout/EstadoDaConsulta'
import { useFalhaDoFormulario } from '@/layout/useFalhaDoFormulario'
import { ateHoje, formatarData, hoje, maisTarde } from '@/lib/data'
import { EventosDaFicha } from './AnimaisDaFicha'
import { Campo, LadoALado } from './CamposDaFicha'
import { FichaDoEstoque, VirarCaixaDeEstoque } from './EstoqueDaFicha'
import { AbaNinhada, ProximoAcasalamento } from './NinhadaDaFicha'
import './FichaDaCaixa.css'

/** Posição vazia da grade: a ficha abre com o formulário de casal, e a caixa nasce com ele */
export interface PosicaoVazia {
  idEstante: number
  face: 'frontal' | 'traseira'
  linha: number
  coluna: number
  codigo: string
  sala: string
  numeroVisivel: string
}

const ROTULO_ESPECIE = { rato: 'Rato', camundongo: 'Camundongo' } as const

/** A ficha da caixa, aberta pelo card do kanban e pela célula da grade */
export function FichaDaCaixa({
  idCaixa,
  posicaoVazia = null,
  aoFechar,
}: {
  idCaixa: number | null
  posicaoVazia?: PosicaoVazia | null
  aoFechar: () => void
}) {
  // depois de formar casal numa posição vazia, a ficha passa a ser a da caixa criada
  const [idCriado, setIdCriado] = useState<number | null>(null)
  const id = idCaixa ?? idCriado
  const ficha = useFicha(id)
  const [escolhido, setEscolhido] = useState<Escolha | null>(null)
  // a caixa de estoque tem a ficha dela, sem casal nem parto
  const deCasal = ficha.data?.tipo === 'casal' ? ficha.data : undefined
  const deEstoque = ficha.data?.tipo === 'estoque' ? ficha.data : undefined
  const escolha = escolhido ?? escolhaInicial(deCasal)
  const endereco = ficha.data?.caixa.endereco ?? posicaoVazia
  const estadoDoEstoque = deEstoque?.caixa.estado

  function fechar() {
    setEscolhido(null)
    setIdCriado(null)
    aoFechar()
  }

  return (
    <Modal
      open={id !== null || posicaoVazia !== null}
      onCancel={fechar}
      footer={null}
      width={760}
      destroyOnHidden
      styles={{
        header: {
          background: deEstoque
            ? estadoDoEstoque
              ? `var(--estado-${estadoDoEstoque}-fundo)`
              : 'var(--cor-suave)'
            : corDoParto(escolha.ordem).fundo,
          margin: '-20px -24px 0',
          padding: '16px 24px',
        },
      }}
      title={
        <Linha espaco={10}>
          <span>Ficha · {endereco?.codigo ?? 'caixa'}</span>
          {endereco && (
            <Etiqueta>
              {endereco.sala} · {endereco.numeroVisivel}
            </Etiqueta>
          )}
          {deEstoque && (
            <Etiqueta>Caixa de estoque {SIMBOLO_DO_SEXO[deEstoque.caixa.sexo]}</Etiqueta>
          )}
          {ficha.data && !ficha.data.caixa.ativa && <Etiqueta tom="atencao">Liberada</Etiqueta>}
        </Linha>
      }
    >
      {id === null && posicaoVazia ? (
        <div className="ficha__aba">
          <p className="ficha__vazio">Posição vazia. Forme um casal para ocupar a caixa.</p>
          <FormarCasal
            alvo={{
              posicao: {
                idEstante: posicaoVazia.idEstante,
                face: posicaoVazia.face,
                linha: posicaoVazia.linha,
                coluna: posicaoVazia.coluna,
              },
            }}
            especie={null}
            aoFormar={setIdCriado}
          />
        </div>
      ) : (
        <EstadoDaConsulta consulta={ficha}>
          {deEstoque && <FichaDoEstoque ficha={deEstoque} />}
          {deCasal && <FichaDoCasal ficha={deCasal} escolha={escolha} aoEscolher={setEscolhido} />}
        </EstadoDaConsulta>
      )}
    </Modal>
  )
}

/** O parto escolhido no seletor: do casal da caixa (idCasal null) ou de um casal de antes */
interface Escolha {
  idCasal: number | null
  ordem: number
}

/** O parto que já nasceu e ainda não desmamou: é nele que o técnico registra seleção e desmame */
function emAndamento(partos: Parto[]): Parto | undefined {
  return [...partos]
    .reverse()
    .find((parto) => parto.dtPartoReal !== null && parto.dtDesmameReal === null)
}

/**
 * Onde o seletor abre: no parto que tem animais nesta caixa (a ninhada que mama, ou a desmamada
 * que ainda não saiu), deste casal ou de um de antes; senão, no parto em andamento; senão, no mais
 * recente do casal da caixa
 */
function escolhaInicial(ficha: FichaDeCasal | undefined): Escolha {
  const casais = [
    { idCasal: null, partos: ficha?.partos ?? [] },
    ...(ficha?.anteriores ?? []).map(({ casal, partos }) => ({ idCasal: casal.id, partos })),
  ]

  for (const { idCasal, partos } of casais) {
    const comAnimais = ficha
      ? partos.find((parto) => vivosNaCaixa(parto, ficha.caixa.id))
      : undefined
    if (comAnimais) return { idCasal, ordem: comAnimais.ordem }
  }

  for (const { idCasal, partos } of casais) {
    const andando = emAndamento(partos)
    if (andando) return { idCasal, ordem: andando.ordem }
  }

  return { idCasal: null, ordem: ficha?.partos.at(-1)?.ordem ?? 1 }
}

function BotaoDoParto({
  ordem,
  ativo,
  aoEscolher,
}: {
  ordem: number
  ativo: boolean
  aoEscolher: () => void
}) {
  const { cor, frente } = corDoParto(ordem)

  return (
    <button
      type="button"
      className="ficha__parto"
      aria-pressed={ativo}
      style={
        ativo
          ? { backgroundColor: cor, borderColor: cor, color: frente }
          : { borderLeftColor: cor, borderLeftWidth: 4 }
      }
      onClick={aoEscolher}
    >
      {ordem}º
    </button>
  )
}

/**
 * A ficha da caixa de casal: o seletor dos partos (os do casal da caixa e os dos casais de antes)
 * e as abas Reprodução, Ninhada e Eventos
 */
function FichaDoCasal({
  ficha,
  escolha,
  aoEscolher: setEscolhido,
}: {
  ficha: FichaDeCasal
  escolha: Escolha
  aoEscolher: (escolha: Escolha) => void
}) {
  const catalogo = useCatalogo()
  const ordem = escolha.ordem
  // parto de um casal de antes: o casal e os partos são os dele, e o resto da ficha é da caixa
  const anterior = ficha.anteriores.find((a) => a.casal.id === escolha.idCasal)
  const casal = anterior?.casal ?? ficha.casal
  const partos = anterior?.partos ?? ficha.partos

  return (
    <>
      <div className="ficha__partos">
        <Texto tom="rotulo">Parto</Texto>
        {COR_DO_PARTO.map(({ cor }, indice) => (
          <BotaoDoParto
            key={cor}
            ordem={indice + 1}
            ativo={escolha.idCasal === null && indice + 1 === ordem}
            aoEscolher={() => setEscolhido({ idCasal: null, ordem: indice + 1 })}
          />
        ))}
      </div>
      {/* os casais que vieram antes nesta caixa: a história, e a ninhada que um deles deixou nela */}
      {ficha.anteriores.map(({ casal: deAntes, partos: dele }) => (
        <div key={deAntes.id} className="ficha__partos">
          <Texto tom="rotulo">Partos do casal {deAntes.identificacao} (encerrado)</Texto>
          {dele.map((parto) => (
            <BotaoDoParto
              key={parto.id}
              ordem={parto.ordem}
              ativo={escolha.idCasal === deAntes.id && parto.ordem === ordem}
              aoEscolher={() => setEscolhido({ idCasal: deAntes.id, ordem: parto.ordem })}
            />
          ))}
        </div>
      ))}

      <Tabs
        items={[
          {
            key: 'reproducao',
            label: 'Reprodução',
            children: (
              <AbaReproducao
                ficha={ficha}
                ordem={ordem}
                partos={partos}
                casalDeAntes={anterior?.casal ?? null}
              />
            ),
          },
          {
            key: 'ninhada',
            label: 'Ninhada',
            // remonta a cada parto escolhido: o formulário aberto é do parto que estava na tela
            children: (
              <AbaNinhada
                key={`${escolha.idCasal ?? 'atual'}-${ordem}`}
                ficha={ficha}
                casal={casal}
                partos={partos}
                ordem={ordem}
              />
            ),
          },
          {
            key: 'eventos',
            label: 'Eventos',
            children: (
              <EventosDaFicha
                eventos={ficha.eventos}
                caixa={{
                  id: ficha.caixa.id,
                  endereco: ficha.caixa.endereco,
                  idLinhagem: idDaLinhagem(
                    catalogo.data,
                    ficha.caixa.especie,
                    ficha.caixa.linhagem,
                  ),
                }}
              />
            ),
          },
        ]}
      />
    </>
  )
}

/**
 * Por que a caixa ainda não recebe casal novo, ou null se recebe: liberada, com parto pendente
 * do casal de antes, ou com animais dentro
 */
function porQueNaoRecebeCasal(ficha: FichaDeCasal): string | null {
  const { caixa } = ficha
  if (!caixa.ativa) return descreverLiberacao(caixa.dtLiberacao, caixa.motivoLiberacao)

  const partos = partosDaCaixa(ficha)
  const pendente = partos.find((parto) => parto.dtPartoReal === null && parto.dtSemNinhada === null)
  if (pendente) {
    return `O ${pendente.ordem}º parto ainda não nasceu: registre o parto ou feche sem ninhada, na aba Ninhada, antes de formar casal novo.`
  }

  const comAnimais = partos.filter((parto) => vivosNaCaixa(parto, caixa.id))
  if (comAnimais.length === 0) return null

  return comAnimais.some((parto) => parto.dtDesmameReal === null)
    ? 'A ninhada ainda mama nesta caixa. Casal novo entra depois do desmame, com os desmamados no estoque.'
    : 'A caixa ainda tem desmamados. Casal novo entra depois que eles forem para o estoque, na aba Ninhada.'
}

function AbaReproducao({
  ficha,
  ordem,
  partos,
  casalDeAntes,
}: {
  ficha: FichaDeCasal
  ordem: number
  /** os partos do casal do parto escolhido */
  partos: Parto[]
  /** o parto escolhido é de um casal que veio antes do da caixa */
  casalDeAntes: Casal | null
}) {
  const { caixa, casal } = ficha
  const parto = partos.find((p) => p.ordem === ordem)
  const confirmados = ficha.partos.filter((p) => p.dtPartoReal !== null).length
  const naoRecebe = casal?.ativo ? null : porQueNaoRecebeCasal(ficha)
  // os vivos da caixa que viram estoque no lugar: os do sexo que sobrou
  const quantosViram = ficha.virarEstoque
    ? partosDaCaixa(ficha).reduce((soma, p) => {
        const aqui = vivosNaCaixa(p, caixa.id)
        return soma + (aqui && ficha.virarEstoque ? doSexo(aqui, ficha.virarEstoque) : 0)
      }, 0)
    : 0

  return (
    <div className="ficha__aba">
      <LadoALado>
        <Campo rotulo="Espécie">{ROTULO_ESPECIE[caixa.especie]}</Campo>
        <Campo rotulo="Linhagem">{caixa.linhagem ?? '—'}</Campo>
      </LadoALado>

      <h3>Casal</h3>
      {/*
       * Cada dado uma vez: a identificação (AB) é o macho e a fêmea juntos, e a data de formação
       * é o acasalamento do 1º parto, na seção do parto
       */}
      {casal && (
        <>
          {!casal.ativo && (
            <div className="ficha__casal">
              Casal encerrado em {formatarData(casal.dtEncerramento)}
            </div>
          )}
          {casal.ativo && confirmados >= MAX_PARTOS_POR_CASAL - 1 && (
            <Etiqueta tom="atencao">
              Último parto: o casal encerra sozinho no {MAX_PARTOS_POR_CASAL}º
            </Etiqueta>
          )}
          <LadoALado>
            <Campo rotulo="Macho (A-E)">{casal.grupoMacho}</Campo>
            <Campo rotulo="Fêmea (A-E)">{casal.grupoFemea}</Campo>
            <Campo rotulo="Partos">
              {confirmados}/{MAX_PARTOS_POR_CASAL}
            </Campo>
          </LadoALado>
        </>
      )}
      {casal?.ativo ? (
        <EncerrarCasal
          idCasal={casal.id}
          desde={maisTarde(casal.dtFormacao, ficha.partos.at(-1)?.dtAcasalamento)}
        />
      ) : naoRecebe ? (
        <p className="ficha__vazio">{naoRecebe}</p>
      ) : (
        <FormarCasal alvo={{ idCaixa: caixa.id }} especie={caixa.especie} />
      )}
      {ficha.virarEstoque && (
        <VirarCaixaDeEstoque idCaixa={caixa.id} sexo={ficha.virarEstoque} total={quantosViram} />
      )}

      <h3>
        <span className="bolinhaDeParto" style={{ backgroundColor: corDoParto(ordem).cor }} />{' '}
        {ordem}º parto
        {casalDeAntes && ` do casal ${casalDeAntes.identificacao}`}
      </h3>
      {/* as previsões vêm da API: parto = acasalamento + 23 dias, desmame = parto + 22 dias */}
      {parto ? (
        <LadoALado>
          <Campo rotulo="Acasalamento" destaque>
            {formatarData(parto.dtAcasalamento)}
          </Campo>
          <Campo rotulo="Parto previsto" destaque>
            {formatarData(parto.dtPartoPrevisto)}
          </Campo>
          <Campo rotulo="Desmame previsto" destaque>
            {formatarData(parto.dtDesmamePrevisto)}
          </Campo>
        </LadoALado>
      ) : (
        <ProximoAcasalamento casal={casalDeAntes ?? casal} partos={partos} ordem={ordem} />
      )}
    </div>
  )
}

const GRUPOS = ['A', 'B', 'C', 'D', 'E'].map((grupo) => ({ value: grupo, label: grupo }))

interface CamposDoCasal {
  idLinhagem: number
  grupoMacho: string
  grupoFemea: string
  dtFormacao: string
}

/** Onde a API pode apontar erro na formação do casal */
const CAMPOS_DO_CASAL: (keyof CamposDoCasal)[] = [
  'idLinhagem',
  'grupoMacho',
  'grupoFemea',
  'dtFormacao',
]

function FormarCasal({
  alvo,
  especie,
  aoFormar,
}: {
  alvo: Pick<CasalNovo, 'idCaixa' | 'posicao'>
  /** null = posição vazia: qualquer linhagem, e a espécie da caixa sai dela */
  especie: CodigoEspecie | null
  aoFormar?: (idCaixa: number) => void
}) {
  const { message } = App.useApp()
  const catalogo = useCatalogo()
  const formar = useFormarCasal()
  const [form] = Form.useForm<CamposDoCasal>()
  const falha = useFalhaDoFormulario(form, CAMPOS_DO_CASAL)

  const especies = (catalogo.data?.especies ?? []).filter(
    (e) => especie === null || e.codigo === especie,
  )
  const linhagens = especies.map((e) => ({
    label: e.nome,
    options: e.linhagens.filter((l) => l.ativa).map((l) => ({ value: l.id, label: l.nome })),
  }))

  // cruzamento rotacional: cada macho tem uma fêmea certa (AB, BC, CD, DE, EA)
  function escolherMacho(grupoMacho: string) {
    const par = catalogo.data?.paresGeneticos.find((p) => p.grupoMacho === grupoMacho)
    if (par) form.setFieldValue('grupoFemea', par.grupoFemea)
  }

  function salvar(campos: CamposDoCasal) {
    falha.limpar()
    // mutateAsync: na caixa que já existe, a ficha recarregada troca este formulário pelo do casal
    formar.mutateAsync({ ...alvo, ...campos }).then(
      ({ idCaixa }) => {
        void message.success(`Casal ${campos.grupoMacho}${campos.grupoFemea} formado.`)
        aoFormar?.(idCaixa)
      },
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name="casal"
      form={form}
      layout="vertical"
      onFinish={salvar}
      initialValues={{ dtFormacao: hoje() }}
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
        <Form.Item
          name="grupoMacho"
          label="Macho (A-E)"
          rules={[{ required: true, message: 'Grupo do macho' }]}
        >
          <Select options={GRUPOS} onChange={escolherMacho} />
        </Form.Item>
        <Form.Item
          name="grupoFemea"
          label="Fêmea (A-E)"
          rules={[{ required: true, message: 'Grupo da fêmea' }]}
        >
          <Select options={GRUPOS} />
        </Form.Item>
        <Form.Item
          name="dtFormacao"
          label="Acasalamento"
          rules={[{ required: true, message: 'Data' }]}
        >
          <CampoDeData max={ateHoje()} />
        </Form.Item>
      </LadoALado>
      <Botao variante="primario" htmlType="submit" loading={formar.isPending}>
        Formar casal
      </Botao>
    </Form>
  )
}

interface CamposDoEncerramento {
  dtEncerramento: string
  motivo: string
}

/**
 * Encerra o casal. O parto pendente continua aberto (pode nascer depois, ou fechar sem ninhada),
 * e a caixa só é liberada sem vivos e sem parto pendente
 */
function EncerrarCasal({
  idCasal,
  desde,
}: {
  idCasal: number
  /** o primeiro dia possível: a formação ou o último acasalamento, o que vier depois */
  desde: DataISO | undefined
}) {
  const { message } = App.useApp()
  const registrar = useRegistrarNaFicha()
  const [aberto, setAberto] = useState(false)
  const [form] = Form.useForm<CamposDoEncerramento>()
  const falha = useFalhaDoFormulario(form, ['dtEncerramento', 'motivo'])

  if (!aberto) {
    return (
      <div>
        <Botao onClick={() => setAberto(true)}>Encerrar casal</Botao>
      </div>
    )
  }

  function encerrar(corpo: CamposDoEncerramento) {
    falha.limpar()
    registrar.mutateAsync({ caminho: `/api/casais/${idCasal}/encerramento`, corpo }).then(
      () => void message.success('Casal encerrado.'),
      (erro: Error) => falha.mostrar(erro),
    )
  }

  return (
    <Form
      name="encerramento"
      form={form}
      layout="vertical"
      initialValues={{ dtEncerramento: hoje() }}
      className="ficha__formulario"
      onFinish={encerrar}
    >
      {falha.erro && <Aviso tom="erro" titulo={falha.erro} />}
      <LadoALado>
        <Form.Item name="dtEncerramento" label="Data" rules={[{ required: true, message: 'Data' }]}>
          <CampoDeData min={desde} max={ateHoje()} />
        </Form.Item>
        <Form.Item
          name="motivo"
          label="Motivo"
          rules={[{ required: true, message: 'Diga o motivo' }]}
        >
          <Input placeholder="ex: queda de produtividade" maxLength={200} />
        </Form.Item>
      </LadoALado>
      <div className="ficha__botoes">
        <Botao variante="perigo" htmlType="submit" loading={registrar.isPending}>
          Encerrar
        </Botao>
        <Botao variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </Form>
  )
}
