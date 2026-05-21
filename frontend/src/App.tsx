import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trades from './pages/Trades'
import Backtests from './pages/Backtests'
import BacktestEntry from './pages/BacktestEntry'
import AddTrade from './pages/AddTrade'
import News from './pages/News'
import Checklist from './pages/Checklist'
import Journal from './pages/Journal'
import Calendar from './pages/Calendar'
import Strategies from './pages/Strategies'
import StrategyForm from './pages/StrategyForm'
import StrategyDetail from './pages/StrategyDetail'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import TradeDetail from './pages/TradeDetail'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AuthGuard from './components/AuthGuard'
import OnboardingGuard from './components/OnboardingGuard'
import { SettingsProvider } from './contexts/SettingsContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '801267490977-sfl1k3m28p55299itgve1k821jscb2k3.apps.googleusercontent.com'

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<AuthGuard><SettingsProvider><Onboarding /></SettingsProvider></AuthGuard>} />
          <Route element={<AuthGuard><SettingsProvider><OnboardingGuard><Layout /></OnboardingGuard></SettingsProvider></AuthGuard>}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/backtests" element={<Backtests />} />
            <Route path="/backtests/new" element={<BacktestEntry />} />
            <Route path="/trade/:id" element={<TradeDetail />} />
            <Route path="/trades/:id" element={<TradeDetail />} />
            <Route path="/add" element={<AddTrade />} />
            <Route path="/edit/:id" element={<AddTrade />} />
            <Route path="/news" element={<News />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/strategies/new" element={<StrategyForm />} />
            <Route path="/strategies/:id" element={<StrategyDetail />} />
            <Route path="/strategies/:id/edit" element={<StrategyForm />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
