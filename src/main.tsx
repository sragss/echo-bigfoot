import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EchoProvider } from '@merit-systems/echo-react-sdk';

const APP_ID = import.meta.env.VITE_ECHO_APP_ID;

if (!APP_ID) {
    throw new Error('Add your Echo App ID to .env');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EchoProvider config={{ appId: APP_ID }}>
      <App />
    </EchoProvider>
  </StrictMode>,
)
