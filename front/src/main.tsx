import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/variables.css'
import './styles/index.css'

async function init() {
  if ((import.meta as any).env.DEV) {
    const { startMockWorker } = await import('./services/mock/browser')
    await startMockWorker()
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

init()
