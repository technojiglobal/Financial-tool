import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent scroll-wheel from changing number input values
document.addEventListener('wheel', (e) => {
  if (e.target.type === 'number') e.target.blur();
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
