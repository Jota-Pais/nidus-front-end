import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Aviso, Resultado } from '@/componentes'
import { ErroDeApi, ErroDeRede } from '@/lib/api'
import { Carregando } from './Carregando'

/**
 * Quanto tempo esperar antes de avisar que a API pode estar acordando.
 *
 * A API na Render dorme por inatividade e leva de 30s a 1min para responder a
 * primeira requisição. O card "Camada de acesso à API" é explícito: isso tem
 * que mostrar **aviso, não erro** — quem abre o sistema e vê vermelho acha que
 * quebrou e liga para a equipe.
 */
const MS_ATE_AVISAR = 3_000

function useEsperaLonga(ativo: boolean, ms = MS_ATE_AVISAR): boolean {
  const [demorou, setDemorou] = useState(false)

  useEffect(() => {
    if (!ativo) {
      setDemorou(false)
      return
    }
    const relogio = window.setTimeout(() => setDemorou(true), ms)
    return () => window.clearTimeout(relogio)
  }, [ativo, ms])

  return demorou
}

interface Consulta {
  isPending: boolean
  error: unknown
}

/**
 * Carregamento, demora e erro de uma consulta, tratados no mesmo lugar.
 *
 * Nenhuma tela escreve o seu próprio: as três situações têm resposta certa e
 * ela é a mesma em todas. Em especial o 403 — autenticado, mas o perfil não
 * alcança o recurso (`RF-ACS-02`) — que não é falha do sistema e não deve
 * aparecer como tal.
 */
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
