import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { ehVersaoAntiga } from '@/app/versaoNova'
import { Botao, Resultado } from '@/componentes'

/** tratamento de erro padronizado da casca. Uma mensagem, um caminho de volta. */
export function Erro() {
  const erro = useRouteError()
  const navegar = useNavigate()

  // a aba é de antes da última publicação: a tela nova só abre com a página recarregada
  if (ehVersaoAntiga(erro)) {
    return (
      <Resultado
        tipo="erro"
        titulo="O Nidus foi atualizado"
        detalhe="Recarregue a página para abrir a versão nova."
        acao={
          <Botao variante="primario" onClick={() => window.location.reload()}>
            Recarregar
          </Botao>
        }
      />
    )
  }

  const status = isRouteErrorResponse(erro) ? erro.status : 500
  const detalhe = isRouteErrorResponse(erro)
    ? erro.statusText
    : erro instanceof Error
      ? erro.message
      : 'Erro inesperado.'

  return (
    <Resultado
      tipo={status === 404 ? 'naoEncontrado' : 'erro'}
      titulo={status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
      detalhe={detalhe}
      acao={
        <Botao variante="primario" onClick={() => navegar('/')}>
          Voltar ao início
        </Botao>
      }
    />
  )
}
