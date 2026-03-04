import { useState } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, Btn, StatsTable, EffBadge, T } from '../components/ui/index.jsx'
import { HBarChart, RadarCompare } from '../components/charts/StatsCharts.jsx'
import { LABELS, ZONAS_ATAQUE } from '../data/eventSchema.js'

export const PlayersPage = () => {
  const { activeStats, activeMatch } = useMatch()
  const [equipo, setEquipo] = useState('local')
  const [selectedId, setSelectedId] = useState(null)
  if (!activeStats) return null

  const allStats = equipo === 'local' ? activeStats.playersLocal : activeStats.playersVisitante
  const selected = selectedId ? allStats.find(s => s.jugador.id === selectedId) : null

  return (
    <div>
      <Section title="Estadísticas de Jugadores"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {['local', 'visitante'].map(t => (
              <Btn key={t} small variant={equipo === t ? 'primary' : 'ghost'} onClick={() => { setEquipo(t); setSelectedId(null) }}>
                {t === 'local' ? '🏠 Local' : '✈️ Visitante'}
              </Btn>
            ))}
          </div>
        }
      >
        {allStats.length === 0 ? (
          <Card><div style={{ textAlign: 'center', color: T.muted, padding: 32 }}>Sin datos de jugadores. Registra eventos con jugador asignado.</div></Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Player list */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {allStats.map((s, i) => (
                <PlayerListItem key={s.jugador.id} stats={s} rank={i + 1}
                  active={selectedId === s.jugador.id}
                  onClick={() => setSelectedId(selectedId === s.jugador.id ? null : s.jugador.id)} />
              ))}
            </Card>

            {/* Player detail */}
            <div>
              {selected ? <PlayerDetail stats={selected} /> : (
                <Card style={{ textAlign: 'center', padding: 40, color: T.muted }}>
                  Selecciona un jugador para ver el detalle
                </Card>
              )}
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Player list item ──────────────────────────────────────────────────────────
const PlayerListItem = ({ stats: s, rank, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    borderBottom: `1px solid ${T.border}22`,
    background: active ? `${T.accent}12` : 'transparent',
    cursor: 'pointer', transition: 'background .15s',
    borderLeft: active ? `3px solid ${T.accent}` : '3px solid transparent',
  }}>
    <span style={{ fontSize: 11, color: T.muted, minWidth: 22 }}>#{rank}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', color: T.text }}>
        {s.jugador.numero ? `${s.jugador.numero}. ` : ''}{s.jugador.nombre}
      </div>
      <div style={{ fontSize: 10, color: T.muted }}>{s.lanzamientos} lanz · {s.goles} goles</div>
    </div>
    <EffBadge value={s.eficacia} />
    <div style={{ fontSize: 14, fontWeight: 'bold', color: T.cyan, marginLeft: 12, fontFamily: T.font, minWidth: 30, textAlign: 'right' }}>
      {s.score}
    </div>
  </div>
)

// ── Player detail ─────────────────────────────────────────────────────────────
const PlayerDetail = ({ stats: s }) => (
  <div>
    {/* Header */}
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: T.text }}>
            {s.jugador.numero ? `#${s.jugador.numero} · ` : ''}{s.jugador.nombre}
          </div>
          {s.jugador.posicion && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.jugador.posicion}</div>}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 'bold', color: T.cyan, fontFamily: T.font }}>{s.score}</div>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1 }}>SCORE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginTop: 14 }}>
        {[
          ['Lanz', s.lanzamientos, T.text],
          ['Goles', s.goles, T.red],
          ['Al Arco', s.alArco, T.cyan],
          ['% Gol', `${s.eficacia}%`, s.eficacia >= 50 ? T.accent : T.warn],
          ['Excl.', s.exclusiones, T.red],
          ['Pérd.', s.perdidas, T.warn],
        ].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center', background: T.card2, borderRadius: 8, padding: '10px 4px' }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: c, fontFamily: T.font }}>{v}</div>
            <div style={{ fontSize: 9, color: T.muted }}>{l}</div>
          </div>
        ))}
      </div>
    </Card>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR ZONA DE ATAQUE</div>
        <HBarChart
          data={s.porZona.filter(r => r.lanzamientos > 0).map(r => ({
            name: `Z${r.zona} ${LABELS.zonaAtaque[r.zona]}`,
            Goles: r.goles, Paradas: r.paradas,
          }))}
          dataKeys={[
            { key: 'Goles',  name: 'Goles',  color: T.red,   stack: 'a' },
            { key: 'Paradas', name: 'Al Arco', color: T.accent, stack: 'a' },
          ]}
          height={200}
        />
      </Card>
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR TÉCNICA</div>
        <StatsTable rows={s.porTipoLanzamiento.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.tipoLanzamiento[r.tipo] }))} />
      </Card>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR DISTANCIA</div>
        <StatsTable rows={s.porDistancia.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.distancia[r.distancia] }))} />
      </Card>
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR SITUACIÓN NUMÉRICA</div>
        <StatsTable rows={s.porSituacion.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.situacionNumerica[r.situacion] }))} />
      </Card>
    </div>
  </div>
)
