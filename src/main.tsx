import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter self-hosted (fallback da fonte do sistema fora do macOS/iOS; sem Google Fonts)
import '@fontsource-variable/inter/wght.css'
import { App } from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
