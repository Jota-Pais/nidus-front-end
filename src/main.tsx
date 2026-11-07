import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { recarregarParaVersaoNova } from './app/versaoNova'
// Ordem importa: 'estilos.css' consome as variáveis de 'tokens.css'
import './app/tokens.css'
import './estilos.css'

// O Vite avisa quando o arquivo de uma tela não carrega, o que acontece na aba aberta antes
// de uma publicação. Recarregada, a página vem com a versão nova e a tela abre
window.addEventListener('vite:preloadError', (evento) => {
  if (recarregarParaVersaoNova()) evento.preventDefault()
})

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root não encontrado no index.html')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
