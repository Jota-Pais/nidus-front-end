import { Button, Result, Typography } from 'antd'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

/** Tratamento de erro padronizado da casca. Uma mensagem, um caminho de volta. */
export function Erro() {
  const erro = useRouteError()
  const navegar = useNavigate()

  const status = isRouteErrorResponse(erro) ? erro.status : 500
  const detalhe =
    isRouteErrorResponse(erro)
      ? erro.statusText
      : erro instanceof Error
        ? erro.message
        : 'Erro inesperado.'

  return (
    <Result
      status={status === 404 ? '404' : 'error'}
      title={status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
      subTitle={<Typography.Text type="secondary">{detalhe}</Typography.Text>}
      extra={
        <Button type="primary" onClick={() => navegar('/')}>
          Voltar ao início
        </Button>
      }
    />
  )
}
