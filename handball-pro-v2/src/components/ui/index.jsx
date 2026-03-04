// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

export const T = {
  bg:     '#060c18',
  card:   '#0b1525',
  card2:  '#0f1e35',
  border: '#182d4a',
  accent: '#00ff87',
  cyan:   '#00d4ff',
  red:    '#ff4757',
  warn:   '#ffa502',
  orange: '#ff6b35',
  text:   '#e2e8f0',
  muted:  '#4a6080',
  font:   "'Courier New', monospace",
}

export const CHART_COLORS = [T.accent, T.cyan, T.warn, T.red, '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e']

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: 20, ...style,
  }}>
    {children}
  </div>
)

// ── Section wrapper ───────────────────────────────────────────────────────────
export const Section = ({ title, children, action }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: T.accent, letterSpacing: 3, textTransform: 'uppercase' }}>
        ▸ {title}
      </h2>
      {action}
    </div>
    {children}
  </div>
)

// ── Button ─────────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'primary', small = false, disabled = false, style = {} }) => {
  const bg    = variant === 'primary' ? T.accent : variant === 'danger' ? T.red : variant === 'cyan' ? T.cyan : T.card2
  const color = variant === 'primary' ? T.bg : variant === 'cyan' ? T.bg : T.text
  const border = variant === 'ghost' ? `1px solid ${T.border}` : 'none'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color, border, borderRadius: 8,
        padding: small ? '6px 14px' : '10px 20px',
        fontSize: small ? 11 : 13, fontFamily: T.font, fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity .15s', ...style,
      }}
    >
      {children}
    </button>
  )
}

// ── Form Input ────────────────────────────────────────────────────────────────
export const FormInput = ({ label, value, onChange, type = 'text', options, placeholder, required }) => (
  <div style={{ marginBottom: 12 }}>
    {label && (
      <label style={{ display: 'block', fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
        {label}{required && ' *'}
      </label>
    )}
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', background: T.card2, color: value ? T.text : T.muted,
        border: `1px solid ${T.border}`, borderRadius: 8,
        padding: '9px 12px', fontSize: 13, fontFamily: T.font,
      }}>
        <option value="">— Seleccionar —</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: T.card2, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 8,
          padding: '9px 12px', fontSize: 13, fontFamily: T.font, boxSizing: 'border-box',
        }}
      />
    )}
  </div>
)

// ── Stat Box ──────────────────────────────────────────────────────────────────
export const StatBox = ({ label, value, sub, color = T.accent }) => (
  <Card style={{ textAlign: 'center', padding: '16px 10px' }}>
    <div style={{ fontSize: 26, fontWeight: 'bold', color, fontFamily: T.font }}>{value}</div>
    <div style={{ fontSize: 10, color: T.muted, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.text, marginTop: 2 }}>{sub}</div>}
  </Card>
)

// ── Pct Bar ───────────────────────────────────────────────────────────────────
export const PctBar = ({ value, color = T.accent, height = 5 }) => (
  <div style={{ background: T.border, borderRadius: 4, height, marginTop: 5 }}>
    <div style={{ width: `${Math.min(value, 100)}%`, background: color, borderRadius: 4, height: '100%', transition: 'width .4s' }} />
  </div>
)

// ── Effectiveness badge ───────────────────────────────────────────────────────
export const EffBadge = ({ value }) => {
  const color = value >= 70 ? T.accent : value >= 55 ? T.warn : T.red
  return (
    <span style={{ color, fontWeight: 'bold', fontFamily: T.font }}>
      {value}%
      <PctBar value={value} color={color} />
    </span>
  )
}

// ── Stats Table ───────────────────────────────────────────────────────────────
export const StatsTable = ({ rows = [], emptyText = 'Sin datos' }) => {
  const active = rows.filter(r => r.lanzamientos > 0)
  if (active.length === 0) return (
    <div style={{ textAlign: 'center', color: T.muted, padding: 32, fontSize: 12 }}>{emptyText}</div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            {['', 'Lanz', 'Goles', 'Paradas', 'Poste', '% Gol', '% Parada'].map(h => (
              <th key={h} style={{ padding: '8px 10px', color: T.muted, fontWeight: 'normal', textAlign: h === '' ? 'left' : 'center' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.border}22` }}>
              <td style={{ padding: '9px 10px', color: T.text, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{r.label}</td>
              <td style={{ padding: '9px 10px', color: T.muted, textAlign: 'center' }}>{r.lanzamientos}</td>
              <td style={{ padding: '9px 10px', color: T.red, textAlign: 'center', fontWeight: 'bold' }}>{r.goles}</td>
              <td style={{ padding: '9px 10px', color: T.accent, textAlign: 'center' }}>{r.paradas}</td>
              <td style={{ padding: '9px 10px', color: T.warn, textAlign: 'center' }}>{r.postes}</td>
              <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                <EffBadge value={r.eficacia} />
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                <EffBadge value={r.efectividad} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
export const Modal = ({ children, onClose, title }) => (
  <div style={{
    position: 'fixed', inset: 0, background: '#000b', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <Card style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: T.accent, fontSize: 14, letterSpacing: 2 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>
      {children}
    </Card>
  </div>
)

// ── Chip selector ─────────────────────────────────────────────────────────────
export const ChipGroup = ({ label, options, value, onChange, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
        {label}{required && ' *'}
      </div>
    )}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const v = opt.value ?? opt
        const l = opt.label ?? opt
        const active = value === v
        return (
          <button key={v} onClick={() => onChange(active ? '' : v)} style={{
            background: active ? T.accent : T.card2, color: active ? T.bg : T.text,
            border: `1px solid ${active ? T.accent : T.border}`,
            borderRadius: 8, padding: '7px 12px', fontSize: 11,
            fontFamily: T.font, fontWeight: active ? 'bold' : 'normal', cursor: 'pointer',
          }}>
            {l}
          </button>
        )
      })}
    </div>
  </div>
)

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📋', title, sub, action }) => (
  <Card style={{ textAlign: 'center', padding: 56 }}>
    <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, color: T.text, marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>{sub}</div>}
    {action}
  </Card>
)
