
import HomePage from './pages/Home.tsx';
import LoginPage from './pages/Login.tsx';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { PrivateRoute } from './contexts/PrivateRoute.tsx';
import TwoFactorAuth from './pages/TwoFactorAuth.tsx';
import ShowQrCode from './pages/ShowQrCode.tsx';
import NotFound from './pages/NotFound.tsx';
import SettingsPage from './pages/Settings.tsx';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/2fa/validate" element={
          <PrivateRoute>
            <TwoFactorAuth />
          </PrivateRoute>
        }/>
        <Route path="/2fa/qrcode" element={
          <PrivateRoute>
            <ShowQrCode />
          </PrivateRoute>
        }/>
        <Route path="/" element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
      }/>
        <Route path="*" element={<NotFound />} />
        <Route path="/settings" element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
