/**
 * Para onde ir depois de entrar.
 *
 * O card "Layout base, tema e roteamento" exige: "rota protegida sem sessão
 * redireciona ao login **e volta para o destino depois de entrar**". Quem
 * clicou num link direto para uma estante volta para aquela estante, não para
 * a home do perfil.
 *
 * `RotaProtegida` guarda o caminho em `state.de`; esta função decide se pode
 * usá-lo.
 */
import { rotaInicial } from './navegacao'
import type { Perfil } from '@/dominio/tipos'

/**
 * ⚠️ **Só caminho interno.** `state` vem da navegação e não é dado confiável:
 * `//outro-site.com` é caminho válido para o navegador e viraria
 * redirecionamento para fora do sistema depois do login — o caminho clássico
 * para phishing em cima de uma tela de login legítima.
 */
export function ehDestinoInterno(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    valor.startsWith('/') &&
    !valor.startsWith('//') &&
    !valor.startsWith('/\\') &&
    valor !== '/login'
  )
}

export function destinoAposLogin(estado: unknown, perfil: Perfil): string {
  const de = (estado as { de?: unknown } | null | undefined)?.de
  return ehDestinoInterno(de) ? de : rotaInicial(perfil)
}
