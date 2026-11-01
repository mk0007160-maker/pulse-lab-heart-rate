import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    const scope = import.meta.env.BASE_URL
    navigator.serviceWorker.register(scope + 'sw.js', { scope }).catch((error) => {
      console.warn('Pulse Lab offline setup not available:', error)
    })
  })
}
