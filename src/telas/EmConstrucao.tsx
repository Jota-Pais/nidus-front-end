import { CabecalhoDaTela, Etiqueta, Linha, Paragrafo, Pilha, Secao, Texto } from '@/componentes'

/** Placeholder de tela */
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
