import {
  StrictMode,
} from 'react'

import {
  createRoot,
} from 'react-dom/client'

import {
  Toaster,
} from 'sonner'

import './index.css'
import App from './App'

createRoot(
  document.getElementById(
    'root',
  ),
).render(
  <StrictMode>

    <App />

    <Toaster
      richColors

      closeButton

      position="top-right"
    />

  </StrictMode>,
)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    setTimeout(() => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Local processing still works online if offline setup is unavailable.
    }), 3000)
  })
}
