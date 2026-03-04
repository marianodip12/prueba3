import { useState } from 'react'
import { MatchProvider } from './context/MatchContext.jsx'
import { Header } from './components/layout/Header.jsx'
import { T } from './components/ui/index.jsx'
import { MatchesPage }     from './pages/MatchesPage.jsx'
import { RegisterPage }    from './pages/RegisterPage.jsx'
import { TeamStatsPage }   from './pages/TeamStatsPage.jsx'
import { PlayersPage }     from './pages/PlayersPage.jsx'
import { GoalkeepersPage } from './pages/GoalkeepersPage.jsx'
import { AdvancedPage }    from './pages/AdvancedPage.jsx'
import { MVPPage }         from './pages/MVPPage.jsx'

const AppContent = () => {
  const [tab, setTab] = useState('matches')

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
