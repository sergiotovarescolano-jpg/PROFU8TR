import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { seedDatabaseIfEmpty } from './db/seed'
import './utils/installPrompt'
import './index.css'

seedDatabaseIfEmpty().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
