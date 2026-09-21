import { ExclamationCircleFilled } from '@ant-design/icons'
import { Modal } from 'antd'
import { compromissosAfetados } from '@/dominio/quadro'
import { ErroDeApi } from '@/lib/api'
import './estilos.css'

/** "Isto vai quebrar um compromisso. Confirma mesmo assim?" - RF-CIC-03 */
export function DialogoDeExcecao({
  erro,
  aoConfirmar,
  aoCancelar,
  confirmando = false,
}: {
  /** O erro da mutação. Só abre se for 'ErroDeApi' com 409. */
  erro: unknown
  /** Reenviar a mesma transição com 'confirmar: true' */
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
