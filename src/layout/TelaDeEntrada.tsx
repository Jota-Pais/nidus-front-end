import type { ReactNode } from 'react'
import { Etiqueta, Logo, Pilha } from '@/componentes'
import { config, mostrarRotuloDeAmbiente } from '@/app/config'
import './telaDeEntrada.css'

/**
 * Casca das telas de quem ainda não entrou: a logo e o que o sistema faz na metade azul, à
 * esquerda, e o formulário à direita. No celular a metade azul sai e a logo vai para o alto
 * do formulário; as duas logos ficam no HTML e o CSS mostra uma de cada vez
 */
export function TelaDeEntrada({ children }: { children: ReactNode }) {
  const ambiente = mostrarRotuloDeAmbiente && <Etiqueta tom="atencao">{config.ambiente}</Etiqueta>

  return (
    <main className="telaDeEntrada">
      <div className="telaDeEntrada__apresentacao">
        <div className="telaDeEntrada__identidade">
          <Logo sobre="azul" />
          <p className="telaDeEntrada__frase">Controle de produção de roedores</p>
          {ambiente}
        </div>
      </div>

      <div className="telaDeEntrada__painel">
        <div className="telaDeEntrada__miolo">
          <Pilha espaco={24}>
            <div className="telaDeEntrada__marca">
              <Logo />
              {ambiente}
            </div>

            {children}
          </Pilha>
        </div>
      </div>
    </main>
  )
}
