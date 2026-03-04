import { useState } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, StatsTable, EffBadge, PctBar, T } from '../components/ui/index.jsx'
import { HBarChart } from '../components/charts/StatsCharts.jsx'
import { GoalMap } from '../components/charts/GoalMap.jsx'
import { LABELS } from '../data/eventSchema.js'

export const GoalkeepersPage = () => {
  const { activeStats } = useMatch()
  const [selectedId, setSelectedId] = useState(null)
  if (!activeStats) return null

  const { goalkeeperStats } = activeStats
  const selected = selectedId ? goalkeeperStats.find(s => s.portero.id === selectedId) : goalkeeperStats[0] || null

  return (
    <div>
      <Section title="Estadísticas de Porteros">
        {goalkeeperStats.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', color: T.muted, padding: 32 }}>
              Sin datos de porteros. Registra lanzamientos con portero asignado.
            </div>
          </Card>
        ) : (
          <>
            {/* GK selector cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
              {goalkeeperStats.map(s => (
                <GKCard key={s.portero.id} stats={s}
                  active={selected?.portero.id === s.portero.id}
                  onClick={() => setSelectedId(s.portero.id)} />
              ))}
            </div>

            {/* Detail */}
            {selected && <GKDetail stats={selected} />}
          </>
        )}
      </Section>
    </div>
  )
}

// ── GK summary card ───────────────────────────────────────────────────────────
const GKCard = ({ stats: s, active, onClick }) => (
  <Card onClick={onClick} style={{ cursor: 'pointer', borderColor: active ? T.accent : T.border, transition: 'border-color .2s' }}>
    <div style={{ fontSize: 14, fontWeight: 'bold', color: T.text, marginBottom: 4 }}>🧤 {s.portero.nombre}</div>
    <div style={{ fontSize: 10, color: T.muted, marginBottom: 10 }}>{s.portero.equipo}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {[['Paradas', s.paradas, T.accent], ['Goles', s.goles, T.red]].map(([l, v, c]) => (
        <div key={l} style={{ textAlign: 'center', background: T.card2, borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: c, fontFamily: T.font }}>{v}</div>
          <div style={{ fontSize: 9, color: T.muted }}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', fontFamily: T.font, color: s.efectividad >= 60 ? T.accent : s.efectividad >= 45 ? T.warn : T.red }}>
        {s.efectividad}%
      </div>
      <div style={{ fontSize: 9, color: T.muted }}>Efectividad · {s.ratingLabel}</div>
      <PctBar value={s.efectividad} color={s.efectividad >= 60 ? T.accent : s.efectividad >= 45 ? T.warn : T.red} />
    </div>
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: T.cyan, fontFamily: T.font }}>{s.valoracion}</div>
      <div style={{ fontSize: 9, color: T.muted }}>Valoración (0–100)</div>
    </div>
    {active && <div style={{ marginTop: 8, fontSize: 10, color: T.accent, letterSpacing: 2 }}>▸ ACTIVO</div>}
  </Card>
)

// ── GK detailed stats ─────────────────────────────────────────────────────────
const GKDetail = ({ stats: s }) => (
  <div>
    <div style={{ fontSize: 13, fontWeight: 'bold', color: T.accent, letterSpacing: 2, marginBottom: 16 }}>
      DETALLE: {s.portero.nombre.toUpperCase()}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
      {/* Goal map */}
      <Card>
        <GoalMap porCuadrante={s.porCuadrante} title="Goles Recibidos por Cuadrante" mode="goals" />
      </Card>

      {/* By distance */}
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR DISTANCIA</div>
        <StatsTable rows={s.porDistancia.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.distancia[r.distancia] }))} />
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR SITUACIÓN NUMÉRICA</div>
          <StatsTable rows={s.porSituacion.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.situacionNumerica[r.situacion] }))} />
        </div>
      </Card>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR ZONA DE ATAQUE</div>
        <HBarChart
          data={s.porZona.filter(r => r.lanzamientos > 0).map(r => ({
            name: `Z${r.zona} – ${LABELS.zonaAtaque[r.zona]}`,
            Paradas: r.paradas, Goles: r.goles,
          }))}
          dataKeys={[
            { key: 'Paradas', name: 'Paradas', color: T.accent, stack: 'a' },
            { key: 'Goles',   name: 'Goles',   color: T.red,   stack: 'a' },
          ]}
          height={240}
        />
      </Card>
      <Card>
        <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR TÉCNICA DE LANZAMIENTO</div>
        <StatsTable rows={s.porTipoLanzamiento.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.tipoLanzamiento[r.tipo] }))} />
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>POR TIPO DE ATAQUE</div>
          <StatsTable rows={s.porTipoAtaque.filter(r => r.lanzamientos > 0).map(r => ({ ...r, label: LABELS.tipoAtaque[r.tipo] }))} />
        </div>
      </Card>
    </div>
  </div>
)
