import './estilos.css'

/**
 * Silhueta do rato no emblema, num quadro 100 x 100 com o círculo de raio 50 no centro: a
 * orelha é um círculo e o corpo sai do círculo pela borda de baixo e pela da esquerda
 */
const ORELHA = { cx: 35.4, cy: 38.3, r: 11.4 }
const CORPO =
  'M46.23 34.26C46.91 35.83 47.72 40.79 48.58 41.13C63.66 47.01 61.37 49.14 73.97 55.64' +
  'C74.94 56.14 77.89 57.44 77.89 58.48C77.89 67.28 61.71 69.62 57.7 71.42' +
  'C48.72 75.44 44.53 85.32 39.56 92.89L36.18 98.05A50 50 0 0 1 4.75 71.27L10.34 64.66' +
  'C16.37 57.54 23.04 52.08 30.74 48.28L35.4 38.3Z'

/**
 * A logo do Nidus: o emblema e o nome. Sobre o azul o emblema ganha um aro branco, porque o
 * lado azul do degradê sumiria no fundo, e o nome fica branco. No claro, o nome vai em azul.
 * O tamanho vem do `font-size` de quem usa: o nome tem 1em e o emblema acompanha
 */
export function Logo({ sobre = 'claro' }: { sobre?: 'claro' | 'azul' }) {
  return (
    <span className={`logo logo--${sobre === 'azul' ? 'sobreAzul' : 'sobreClaro'}`}>
      <svg className="logo__emblema" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle {...ORELHA} />
        <path d={CORPO} />
      </svg>
      <span className="logo__nome">Nidus</span>
    </span>
  )
}
