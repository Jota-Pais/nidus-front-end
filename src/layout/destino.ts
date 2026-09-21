// para onde ir depois de entrar
import { rotaInicial } from './navegacao'
import type { Perfil } from '@/dominio/tipos'

/**
 * Só caminho interno. 'state' vem da navegação e não é dado confiável:
 * '//outro-site.com' é caminho válido para o navegador e viraria redirecionamento
 * para fora do sistema depois do login - o caminho clássico para phishing em cima de
 * uma tela de login legítima
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
