// A escolha entre o tema claro e o escuro: guardada no navegador, aplicada no <html> e lida pelo
// React. O script do index.html faz a mesma leitura antes do primeiro desenho, para a página não
// piscar clara ao abrir no escuro; a chave e o nome do atributo têm de ser os mesmos nos dois.
import { useSyncExternalStore } from 'react'

export type Esquema = 'claro' | 'escuro'

export const CHAVE_DO_ESQUEMA = 'nidus.tema'

/** Quando o navegador não deixa guardar (janela privada, dados bloqueados), a escolha vale até fechar a aba */
let emMemoria: Esquema | null = null

/** O esquema guardado. Sem nada guardado, ou com lixo, é o claro */
export function esquemaSalvo(): Esquema {
  try {
    return localStorage.getItem(CHAVE_DO_ESQUEMA) === 'escuro' ? 'escuro' : 'claro'
  } catch {
    return emMemoria ?? 'claro'
  }
}

/** Põe o esquema no <html>, onde o `tokens.css` o lê */
export function aplicarEsquema(esquema: Esquema) {
  document.documentElement.dataset.tema = esquema
}

const ouvintes = new Set<() => void>()

export function escolherEsquema(esquema: Esquema) {
  emMemoria = esquema
  try {
    localStorage.setItem(CHAVE_DO_ESQUEMA, esquema)
  } catch {
    // sem armazenamento: vale só nesta aba
  }
  aplicarEsquema(esquema)
  ouvintes.forEach((avisar) => avisar())
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar)
  // outra aba do sistema mudou a escolha
  window.addEventListener('storage', avisar)
  return () => {
    ouvintes.delete(avisar)
    window.removeEventListener('storage', avisar)
  }
}

/** O esquema atual e a troca dele */
export function useEsquema(): [Esquema, (esquema: Esquema) => void] {
  const esquema = useSyncExternalStore(assinar, esquemaSalvo, () => 'claro' as Esquema)
  return [esquema, escolherEsquema]
}
