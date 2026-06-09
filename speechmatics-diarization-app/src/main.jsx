import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DecoyGate from './components/DecoyGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DecoyGate>
      <App />
    </DecoyGate>
  </StrictMode>,
)
