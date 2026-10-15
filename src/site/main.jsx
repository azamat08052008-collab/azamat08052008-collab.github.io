import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/mulish'
import '@fontsource/montserrat-alternates/500.css'
import '@fontsource/montserrat-alternates/600.css'
import '@fontsource/montserrat-alternates/700.css'
import '@fontsource/montserrat-alternates/800.css'
import './site.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
