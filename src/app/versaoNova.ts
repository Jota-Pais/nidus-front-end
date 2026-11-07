// Cada tela vem num arquivo com um código no nome, e a cada publicação esses nomes mudam: os
// antigos deixam de existir. Quem estava com o Nidus aberto antes da publicação ainda pede o
// arquivo velho, e a tela não abre. Recarregar a página traz a versão nova

const CHAVE = 'nidus:recargaPorVersaoNova'

/** Duas recargas seguidas dentro deste tempo param: o problema não era versão antiga */
const INTERVALO_MS = 10_000

/** A falha de buscar o arquivo de uma tela, como cada navegador a escreve */
export function ehVersaoAntiga(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return /dynamically imported module|Importing a module script failed/i.test(mensagem)
}

/**
 * Recarrega a página para buscar a versão nova, mas não em seguida de outra recarga: aí a
 * versão já é a nova, e recarregar de novo seria um laço. Diz se recarregou
 */
export function recarregarParaVersaoNova(
  recarregar: () => void = () => window.location.reload(),
  agora: number = Date.now(),
): boolean {
  try {
    if (agora - Number(sessionStorage.getItem(CHAVE) ?? 0) < INTERVALO_MS) return false
    sessionStorage.setItem(CHAVE, String(agora))
  } catch {
    // sem sessionStorage (aba anônima com bloqueio), recarrega uma vez mesmo sem a trava
  }

  recarregar()
  return true
}
