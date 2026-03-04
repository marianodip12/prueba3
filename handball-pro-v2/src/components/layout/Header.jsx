import { T } from '../ui/index.jsx'
import { useMatch } from '../../context/MatchContext.jsx'

const TABS = [
  { id: 'matches',    label: '🏆 Partidos' },
  { id: 'register',  label: '⚡ Registrar',  requiresMatch: true },
  { id: 'team',      label: '📊 Equipo',     requiresMatch: true },
  { id: 'players',   label: '👥 Jugadores',  requiresMatch: true },
  { id: 'goalkeepers', label: '🧤 Porteros', requiresMatch: true },
  { id: 'advanced',  label: '📈 Avanzado',   requiresMatch: true },
  { id: 'mvp',       label: '🥇 MVP',        requiresMatch: true },
]

export const Header = ({ tab, setTab }) => {
  const { activeMatch } = useMatch()

  return (
    <header style={{
      background: T.card, borderBottom: `2px solid ${T.accent}`,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        display: 'flex', alignItems: 'stretch', overflowX: 'auto',
        maxWidth: 1440, margin: '0 auto', padding: '0 16px',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingRight: 20, borderRight: `1px solid ${T.border}`, minWidth: 180,
        }}>
          <div style={{ fontSize: 24 }}>🤾</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: T.accent, letterSpacing: 2 }}>
              HANDBALL PRO
            </div>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1 }}>ANALYTICS ENGINE v2</div>
          </div>
        </div>

        {/* Nav tabs */}
        {TABS.map(t => {
          const disabled = t.requiresMatch && !activeMatch
          const active   = tab === t.id
          return (
            <button
              key={t.id}
              disabled={disabled}
              onClick={() => !disabled && setTab(t.id)}
              style={{
                background: active ? `${T.accent}20` : 'transparent',
                color: active ? T.accent : disabled ? `${T.muted}55` : T.text,
                border: 'none',
                borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
                padding: '16px 16px', fontSize: 12, fontFamily: T.font,
                fontWeight: active ? 'bold' : 'normal',
                cursor: disabled ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', transition: 'all .15s', marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          )
        })}

        {/* Active match indicator */}
        {activeMatch && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
            <div style={{ width: 6, height: 6, background: T.accent, borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: T.muted }}>
              vs <span style={{ color: T.cyan, fontWeight: 'bold' }}>{activeMatch.rival || 'Rival'}</span>
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
