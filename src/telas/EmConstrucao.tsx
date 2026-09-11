import { CabecalhoDaTela, Etiqueta, Linha, Paragrafo, Pilha, Secao, Texto } from '@/componentes'

/**
 * Placeholder de tela.
 *
 * A casca existe e a rota funciona; o conteúdo de cada tela é um card próprio
 * no backlog do Trello. Isto deixa o requisito à vista de quem for pegar o
 * card, em vez de deixar a rota vazia.
 *
 * ⚠️ **É a única tela que mostra ID de requisito**, e é de propósito: ela
 * existe para ser lida por quem vai implementar, não pelo técnico de luvas. A
 * tela que a substituir não herda as etiquetas.
 */
export function EmConstrucao({
  titulo,
  ator,
  requisitos,
  descricao,
  atencao,
}: {
  titulo: string
  ator: string
  requisitos: string[]
  descricao: string
  atencao?: string
}) {
  return (
    <Pilha>
      <CabecalhoDaTela
        titulo={titulo}
        descricao={
          <Linha espaco={6}>
            <Etiqueta contorno>Ator: {ator}</Etiqueta>
            {requisitos.map((requisito) => (
              <Etiqueta key={requisito} tom="acento">
                {requisito}
              </Etiqueta>
            ))}
          </Linha>
        }
      />

      <Secao titulo="O que esta tela precisa fazer">
        <Pilha espaco={12}>
          <Paragrafo>{descricao}</Paragrafo>
          {atencao && (
            <Linha espaco={8} alinhamento="flex-start">
              <Etiqueta tom="atencao">Atenção</Etiqueta>
              <Texto tom="secundario">{atencao}</Texto>
            </Linha>
          )}
        </Pilha>
      </Secao>

      <Texto tom="secundario">
        Card no backlog do Trello. A casca, o tema, a legenda de estado e a formatação de data já
        estão prontos — esta tela consome, não reimplementa.
      </Texto>
    </Pilha>
  )
}
