import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trades from './pages/Trades'
import AddTrade from './pages/AddTrade'
import News from './pages/News'
import Checklist from './pages/Checklist'
import Journal from './pages/Journal'
import Login from './pages/Login'
import AuthGuard from './components/AuthGuard'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '801267490977-sfl1k3m28p55299itgve1k821jscb2k3.apps.googleusercontent.com'

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/add" element={<AddTrade />} />
            <Route path="/edit/:id" element={<AddTrade />} />
            <Route path="/news" element={<News />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
