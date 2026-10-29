import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Aviso, Resultado } from '@/componentes'
import { ErroDeApi, ErroDeRede } from '@/lib/api'
import { Carregando } from './Carregando'

/** quanto tempo esperar antes de avisar que a API pode estar acordando */
const MS_ATE_AVISAR = 3_000

function useEsperaLonga(ativo: boolean): boolean {
  const [demorou, setDemorou] = useState(false)

  useEffect(() => {
    if (!ativo) {
      setDemorou(false)
      return
    }
    const relogio = window.setTimeout(() => setDemorou(true), MS_ATE_AVISAR)
    return () => window.clearTimeout(relogio)
  }, [ativo])

  return demorou
}

interface Consulta {
  isPending: boolean
  error: unknown
}

/** carregamento, demora e erro de uma consulta, tratados no mesmo lugar. */
export function EstadoDaConsulta({
  consulta,
  rotulo,
  children,
}: {
  consulta: Consulta
  rotulo?: string
  children: ReactNode
}) {
  const demorou = useEsperaLonga(consulta.isPending)

  if (consulta.isPending) {
    return demorou ? (
      <Aviso tom="informacao" titulo="Acordando o servidor">
        A primeira requisição do dia pode levar até um minuto: a API entra em repouso por
        inatividade. Não é erro — pode aguardar.
      </Aviso>
    ) : (
      <Carregando {...(rotulo ? { rotulo } : {})} />
    )
  }

  const erro = consulta.error

  if (erro instanceof ErroDeApi && erro.status === 403) {
    return (
      <Resultado
        tipo="semPermissao"
        titulo="Sem permissão"
        detalhe={erro.message || 'Seu perfil não alcança esta tela.'}
      />
    )
  }

  if (erro instanceof ErroDeRede) {
    return (
      <Aviso tom="atencao" titulo="Servidor indisponível">
        {erro.message}
      </Aviso>
    )
  }

  if (erro) {
    return <Aviso tom="erro" titulo={(erro as Error).message} />
  }

  return <>{children}</>
}
