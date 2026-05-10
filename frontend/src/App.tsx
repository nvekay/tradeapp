import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trades from './pages/Trades'
import AddTrade from './pages/AddTrade'
import News from './pages/News'
import Checklist from './pages/Checklist'
import Journal from './pages/Journal'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
  )
}
