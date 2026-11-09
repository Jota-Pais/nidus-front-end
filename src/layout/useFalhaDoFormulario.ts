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
 * Como o formulário chama o campo que a API apontou. Quase sempre é o mesmo nome; muda quando o
 * corpo e o formulário se organizam diferente (a API fala no 'itens.0' que o formulário mandou, o
 * formulário fala nos machos)
 */
export type NomeNoFormulario = (chave: string) => string

const mesmoNome: NomeNoFormulario = (chave) => chave

/** Os campos que a API apontou, com o nome que eles têm no formulário */
function apontadosNa(falha: Error, nome: NomeNoFormulario): [string, string][] {
  return falha instanceof ErroDeApi
    ? Object.entries(falha.campos).map(([chave, mensagem]) => [nome(chave), mensagem])
    : []
}

/**
 * O que dizer no aviso: o que a API apontou fora dos campos do formulário é o motivo, e vai no
 * lugar do "Confira os campos destacados", que sem campo destacado não diz nada
 */
export function motivoDaFalha(
  falha: Error,
  campos: string[] = [],
  nome: NomeNoFormulario = mesmoNome,
): string {
  const fora = apontadosNa(falha, nome)
    .filter(([campo]) => !campos.includes(campo))
    .map(([, mensagem]) => mensagem)

  return fora.length > 0 ? fora.join(' ') : falha.message
}

/**
 * Se a API apontou um campo do formulário, a mensagem aparece nele; o resto (rede,
 * credencial, tentativas demais, campo que o formulário não tem) vai para o aviso. `campos`
 * são os campos do formulário, e o primeiro é o que recebe o foco quando o erro não aponta
 * nenhum. O campo de dentro de um grupo se escreve com ponto, como a API: 'machos.destino'.
 *
 * Alguns campos só aparecem quando a API pede (de qual pedido saem os reservados, a caixa para
 * onde voltam os animais): 'pediu' diz se a API já apontou o campo, para o formulário mostrá-lo,
 * e a mensagem entra nele assim que ele aparece.
 *
 * O foco volta ao campo depois do erro: o formulário fica desabilitado durante a chamada,
 * o navegador tira o foco do campo desabilitado e não devolve, e quem corrige pelo teclado
 * digitaria no vazio
 */
export function useFalhaDoFormulario(form: FormInstance, campos: string[], inicial?: string) {
  const [erro, setErro] = useState<string | null>(inicial ?? null)
  const [pedidos, setPedidos] = useState<ReadonlySet<string>>(new Set())
  const focar = useRef<string | null>(null)
  const pendentes = useRef<[string, string][]>([])

  // Roda depois do render em que a chamada terminou, quando o campo já está habilitado e o que a
  // API acabou de pedir já apareceu
  useEffect(() => {
    if (pendentes.current.length > 0) {
      form.setFields(
        pendentes.current.map(([campo, mensagem]) => ({
          name: caminhoDoCampo(campo),
          errors: [mensagem],
        })),
      )
      pendentes.current = []
    }
    if (focar.current === null) return
    form.getFieldInstance(caminhoDoCampo(focar.current))?.focus()
    focar.current = null
  })

  function mostrarComNomes(falha: Error, nome: NomeNoFormulario) {
    const apontados = apontadosNa(falha, nome)
    const nosCampos = apontados.filter(([campo]) => campos.includes(campo))
    const algumFora = apontados.length > nosCampos.length

    if (nosCampos.length === 0) {
      setErro(motivoDaFalha(falha, campos, nome))
      focar.current = campos[0] ?? null
      return
    }

    setErro(algumFora ? motivoDaFalha(falha, campos, nome) : null)
    setPedidos((antes) => new Set([...antes, ...nosCampos.map(([campo]) => campo)]))
    // no campo que já está na tela agora; no que a API acabou de pedir, depois que ele aparecer
    form.setFields(
      nosCampos.map(([campo, mensagem]) => ({ name: caminhoDoCampo(campo), errors: [mensagem] })),
    )
    pendentes.current = nosCampos
    focar.current = nosCampos[0]?.[0] ?? null
  }

  return {
    erro,
    /** um argumento só: serve direto como o onError de uma mutação */
    mostrar: (falha: Error) => mostrarComNomes(falha, mesmoNome),
    /** quando a API chama os campos de outro jeito que o formulário (os itens da baixa) */
    mostrarComNomes,
    limpar: () => setErro(null),
    /** a API já apontou este campo: o formulário mostra o que só aparece quando ela pede */
    pediu: (campo: string) => pedidos.has(campo),
  }
}
