import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/authProviders.tsx';
import { setupInterceptors } from './services/api';

// Inicializa os interceptors do Axios para refresh automático de token
setupInterceptors();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
