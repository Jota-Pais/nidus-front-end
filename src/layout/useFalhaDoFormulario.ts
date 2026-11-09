// erro de formulário que fala com a API: no campo quando a API aponta um, no aviso quando não
import type { FormInstance } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { ErroDeApi } from '@/lib/api'

/**
 * O campo do antd para a chave que a API devolve em 'campos'. A API escreve o caminho com ponto,
 * como o zod gera ('machos.destino', 'itens.0.idPedido'); o antd quer a lista, com o índice como
 * número
 */
export function caminhoDoCampo(chave: string): (string | number)[] {
  return chave.split('.').map((parte) => (/^\d+$/.test(parte) ? Number(parte) : parte))
}

/**
 * O que dizer no aviso: o que a API apontou fora dos campos do formulário é o motivo, e vai no
 * lugar do "Confira os campos destacados", que sem campo destacado não diz nada
 */
export function motivoDaFalha(falha: Error, campos: string[] = []): string {
  const fora =
    falha instanceof ErroDeApi
      ? Object.entries(falha.campos)
          .filter(([campo]) => !campos.includes(campo))
          .map(([, mensagem]) => mensagem)
      : []

  return fora.length > 0 ? fora.join(' ') : falha.message
}

/**
 * Se a API apontou um campo do formulário, a mensagem aparece nele; o resto (rede,
 * credencial, tentativas demais, campo que o formulário não tem) vai para o aviso. `campos`
 * são os campos do formulário, e o primeiro é o que recebe o foco quando o erro não aponta
 * nenhum. O campo de dentro de um grupo se escreve com ponto, como a API: 'machos.destino'.
 *
 * O foco volta ao campo depois do erro: o formulário fica desabilitado durante a chamada,
 * o navegador tira o foco do campo desabilitado e não devolve, e quem corrige pelo teclado
 * digitaria no vazio
 */
export function useFalhaDoFormulario(form: FormInstance, campos: string[], inicial?: string) {
  const [erro, setErro] = useState<string | null>(inicial ?? null)
  const focar = useRef<string | null>(null)

  // Roda depois do render em que a chamada terminou, quando o campo já está habilitado
  useEffect(() => {
    if (focar.current === null) return
    form.getFieldInstance(caminhoDoCampo(focar.current))?.focus()
    focar.current = null
  })

  function mostrar(falha: Error) {
    const apontados = falha instanceof ErroDeApi ? Object.entries(falha.campos) : []
    const nosCampos = apontados.filter(([campo]) => campos.includes(campo))
    const algumFora = apontados.length > nosCampos.length

    if (nosCampos.length === 0) {
      setErro(motivoDaFalha(falha, campos))
      focar.current = campos[0] ?? null
      return
    }

    setErro(algumFora ? motivoDaFalha(falha, campos) : null)
    form.setFields(
      nosCampos.map(([campo, mensagem]) => ({ name: caminhoDoCampo(campo), errors: [mensagem] })),
    )
    focar.current = nosCampos[0]?.[0] ?? null
  }

  return { erro, mostrar, limpar: () => setErro(null) }
}
