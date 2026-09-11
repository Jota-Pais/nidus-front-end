import { ExclamationCircleFilled } from '@ant-design/icons'
import { Modal } from 'antd'
import { compromissosAfetados } from '@/dominio/quadro'
import { ErroDeApi } from '@/lib/api'
import './estilos.css'

/**
 * "Isto vai quebrar um compromisso. Confirma mesmo assim?" — `RF-CIC-03`.
 *
 * O servidor devolve **409 `TRANSICAO_CONTRARIA_COMPROMISSO`** com a lista do
 * que será quebrado. A tela mostra, o usuário decide, e o reenvio vai com
 * `confirmar: true` — e aí a transição é gravada **como exceção**.
 *
 * ⚠️ **Não é uma confirmação genérica, e por isso não usa o
 * `BotaoDeConfirmacao`.** "Tem certeza?" não informa nada; o que faz o
 * usuário decidir direito é ver a remessa, o projeto e a quantidade por sexo
 * que ele está desmarcando. Um técnico que enxerga "2 machos da remessa #17,
 * projeto 23080.001234/2026-11" toma outra decisão que um técnico que
 * enxerga "Tem certeza?".
 *
 * ⚠️ **Só entende 409.** Qualquer outro erro não é exceção de negócio: é
 * falha, e vai para o `MensagemDeErro` da tela. Por isso o diálogo não abre
 * com erro de outro status.
 *
 * ⚠️ `RNF-06` — a exceção fica registrada com autor, data, origem e destino.
 * O diálogo diz isso ao usuário: gravar como exceção não é burlar a regra, é
 * assumi-la com nome.
 */
export function DialogoDeExcecao({
  erro,
  aoConfirmar,
  aoCancelar,
  confirmando = false,
}: {
  /** O erro da mutação. Só abre se for `ErroDeApi` com 409. */
  erro: unknown
  /** Reenviar a mesma transição com `confirmar: true`. */
  aoConfirmar: () => void
  aoCancelar: () => void
  confirmando?: boolean
}) {
  const ehExcecao = erro instanceof ErroDeApi && erro.ehRegraDeNegocio
  const compromissos = ehExcecao ? compromissosAfetados(erro.corpoDoErro) : []

  return (
    <Modal
      open={ehExcecao}
      title={
        <span className="dialogoDeExcecao__titulo">
          <ExclamationCircleFilled aria-hidden="true" />
          Esta mudança quebra um compromisso
        </span>
      }
      onCancel={aoCancelar}
      onOk={aoConfirmar}
      okText="Confirmar mesmo assim"
      cancelText="Cancelar"
      okButtonProps={{ danger: true }}
      cancelButtonProps={{ disabled: confirmando }}
      confirmLoading={confirmando}
      maskClosable={!confirmando}
      destroyOnHidden
    >
      {ehExcecao && <p className="dialogoDeExcecao__mensagem">{erro.message}</p>}

      {compromissos.length > 0 && (
        <ul className="dialogoDeExcecao__lista">
          {compromissos.map((compromisso) => (
            <li key={compromisso.idRemessa} className="dialogoDeExcecao__item">
              <span className="dialogoDeExcecao__remessa">Remessa #{compromisso.idRemessa}</span>
              <span className="dialogoDeExcecao__projeto">{compromisso.projeto}</span>
              <span
                className="dialogoDeExcecao__quantidade"
                aria-label={`${compromisso.qtdM} machos e ${compromisso.qtdF} fêmeas`}
              >
                <b>{compromisso.qtdM}</b> M · <b>{compromisso.qtdF}</b> F
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="dialogoDeExcecao__aviso">
        Confirmando, a mudança é registrada como exceção, com o seu nome, a data e o estado de
        origem e destino. Nada é apagado.
      </p>
    </Modal>
  )
}
