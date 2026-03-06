import { useState } from 'react'
import { MatchProvider, useMatch } from './context/MatchContext.jsx'
import { Header }          from './components/layout/Header.jsx'
import { T }               from './components/ui/index.jsx'
import { MatchesPage }     from './pages/MatchesPage.jsx'
import { RegisterPage }    from './pages/RegisterPage.jsx'
import { TeamStatsPage }   from './pages/TeamStatsPage.jsx'
import { PlayersPage }     from './pages/PlayersPage.jsx'
import { GoalkeepersPage } from './pages/GoalkeepersPage.jsx'
import { AdvancedPage }    from './pages/AdvancedPage.jsx'
import { MVPPage }         from './pages/MVPPage.jsx'

const AppContent = () => {
  const [tab, setTab]  = useState('matches')
  const { loading, error } = useMatch()

  if (loading) return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🤾</div>
      <div style={{ fontSize: 14, color: T.accent, letterSpacing: 3, fontFamily: T.font }}>CARGANDO...</div>
      <div style={{ fontSize: 11, color: T.muted, fontFamily: T.font }}>Conectando con Supabase</div>
    </div>
  )

  if (error) return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <div style={{ fontSize: 14, color: T.red, fontFamily: T.font }}>Error de conexión</div>
      <div style={{ fontSize: 12, color: T.muted, fontFamily: T.font, maxWidth: 400, textAlign: 'center' }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, background: T.accent, color: T.bg, border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: T.font, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}>
        🔄 Reintentar
      </button>
    </div>
  )

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font }}>
      <Header tab={tab} setTab={setTab} />
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 20px' }}>
        {tab === 'matches'     && <MatchesPage setTab={setTab} />}
        {tab === 'register'    && <RegisterPage />}
        {tab === 'team'        && <TeamStatsPage />}
        {tab === 'players'     && <PlayersPage />}
        {tab === 'goalkeepers' && <GoalkeepersPage />}
        {tab === 'advanced'    && <AdvancedPage />}
        {tab === 'mvp'         && <MVPPage />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <MatchProvider>
      <AppContent />
    </MatchProvider>
  )
}
