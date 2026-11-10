/**
 * Abre a tela de teste com uma largura: o `matchMedia` do jsdom passa a responder às consultas de
 * largura (`min-width`, `max-width`) como uma tela de verdade daquele tamanho, e o antd mede por
 * elas (`Grid.useBreakpoint`, o `breakpoint` do Sider). Devolve a função que desfaz. Ex.:
 * `const voltar = larguraDaTela(390)` para o celular, e `voltar()` no fim do teste
 */
export function larguraDaTela(largura: number): () => void {
  const original = window.matchMedia

  window.matchMedia = (consulta: string) => {
    const condicoes = [...consulta.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g)]
    const atende =
      condicoes.length > 0 &&
      condicoes.every(([, lado, valor]) =>
        lado === 'min' ? largura >= Number(valor) : largura <= Number(valor),
      )
    return { ...original(consulta), matches: atende } as MediaQueryList
  }

  return () => {
    window.matchMedia = original
  }
}
