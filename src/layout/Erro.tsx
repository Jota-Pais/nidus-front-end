import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { Botao, Resultado } from '@/componentes'

/** Tratamento de erro padronizado da casca. Uma mensagem, um caminho de volta. */
export function Erro() {
  const erro = useRouteError()
  const navegar = useNavigate()

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
