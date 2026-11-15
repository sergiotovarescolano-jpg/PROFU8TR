import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './utils/installPrompt'
import './index.css'

// La biblioteca de ejercicios empieza vacía: cada usuario añade los suyos.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
