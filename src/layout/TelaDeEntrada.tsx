import type { ReactNode } from 'react'
import { Etiqueta, Linha, Pilha } from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import './appLayout.css'
import './telaDeEntrada.css'

/** Casca das telas de quem ainda não entrou: a foto à esquerda e o painel com a marca à direita */
export function TelaDeEntrada({ children }: { children: ReactNode }) {
  return (
    <main className="telaDeEntrada">
      <div className="telaDeEntrada__imagem" role="presentation" />

      <div className="telaDeEntrada__painel">
        <div className="telaDeEntrada__miolo">
          <Pilha espaco={24}>
            {/* A mesma marca da faixa do `AppLayout`: deixa visível que é o
                mesmo sistema antes de entrar. */}
            <Linha espaco={12}>
              <span className="casca__marca" aria-hidden="true" />
              <span className="telaDeEntrada__nome">Nidus</span>
              {mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>}
            </Linha>

            {children}
          </Pilha>
        </div>
      </div>
    </main>
  )
}
