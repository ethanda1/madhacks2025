import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useDarkMode } from './useDarkMode'

function Root() {

  return (
    <>
      {/* Dark Mode Toggle Button */}
     
      <App />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

export default Root;
