import { useState, useMemo } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, Btn, StatsTable, T } from '../components/ui/index.jsx'
import { HBarChart } from '../components/charts/StatsCharts.jsx'
import { buildStatsRow } from '../utils/calculations.js'
import { soloLanzamientos, porEquipo } from '../utils/filters.js'
import {
  ZONAS_ATAQUE, DISTANCIAS, SITUACIONES_NUMERICAS, TIPOS_ATAQUE,
  TIPOS_LANZAMIENTO, TIPOS_EVENTO, LABELS,
} from '../data/eventSchema.js'

const VIEWS = [
  { id: 'zona',      label: '🗺 Por Zona Ataque' },
  { id: 'distancia', label: '📏 Por Distancia' },
  { id: 'situacion', label: '🔢 Situación Numérica' },
  { id: 'ataque',    label: '⚡ Tipo de Ataque' },
  { id: 'tecnica',   label: '🤸 Técnica' },
  { id: 'infracc',   label: '🚨 Infracciones' },
]

export const AdvancedPage = () => {
  const { activeMatch, activeStats } = useMatch()
  const [view, setView] = useState('zona')
  const [equipo, setEquipo] = useState('local')
  if (!activeStats || !activeMatch) return null

  const eventos = activeMatch.eventos || []
  const evs = porEquipo(eventos, equipo)

  const rows = useMemo(() => {
    const lanz = soloLanzamientos(evs)
    switch (view) {
      case 'zona':
        return Object.values(ZONAS_ATAQUE).map(z => ({
          ...buildStatsRow(`Zona ${z} – ${LABELS.zonaAtaque[z]}`, lanz.filter(e => e.zonaAtaque === z)),
        }))
      case 'distancia':
        return Object.values(DISTANCIAS).map(d => ({
          ...buildStatsRow(LABELS.distancia[d], lanz.filter(e => e.distancia === d)),
        }))
      case 'situacion':
        return Object.values(SITUACIONES_NUMERICAS).map(s => ({
          ...buildStatsRow(LABELS.situacionNumerica[s], lanz.filter(e => e.situacionNumerica === s)),
        }))
      case 'ataque':
        return Object.values(TIPOS_ATAQUE).map(t => ({
          ...buildStatsRow(LABELS.tipoAtaque[t], lanz.filter(e => e.tipoAtaque === t)),
        }))
      case 'tecnica':
        return Object.values(TIPOS_LANZAMIENTO).map(t => ({
          ...buildStatsRow(LABELS.tipoLanzamiento[t], lanz.filter(e => e.tipoLanzamiento === t)),
        }))
      case 'infracc':
        return [
          { label: 'Exclusiones', total: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.EXCLUSION).length, goles: 0, paradas: 0, postes: 0, fuera: 0, alArco: 0, eficacia: 0, efectividad: 0, lanzamientos: 0 },
          { label: 'Pérdidas',    total: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PERDIDA).length,   goles: 0, paradas: 0, postes: 0, fuera: 0, alArco: 0, eficacia: 0, efectividad: 0, lanzamientos: 0 },
          { label: 'Pasos/Dobles', total: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PASOS).length,   goles: 0, paradas: 0, postes: 0, fuera: 0, alArco: 0, eficacia: 0, efectividad: 0, lanzamientos: 0 },
          { label: 'Pisar Línea', total: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.LINEA).length,    goles: 0, paradas: 0, postes: 0, fuera: 0, alArco: 0, eficacia: 0, efectividad: 0, lanzamientos: 0 },
          { label: 'Timeouts',    total: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.TIMEOUT).length,  goles: 0, paradas: 0, postes: 0, fuera: 0, alArco: 0, eficacia: 0, efectividad: 0, lanzamientos: 0 },
        ].filter(r => r.total > 0)
      default: return []
    }
  }, [view, equipo, eventos])

  const chartData = rows.filter(r => r.lanzamientos > 0).map(r => ({
    name: r.label, Goles: r.goles, Paradas: r.paradas, '% Gol': r.eficacia, '% Parada': r.efectividad,
  }))

  return (
    <div>
      <Section title="Análisis Avanzado"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {['local', 'visitante'].map(t => (
              <Btn key={t} small variant={equipo === t ? 'primary' : 'ghost'} onClick={() => setEquipo(t)}>
                {t === 'local' ? '🏠 Local' : '✈️ Visitante'}
              </Btn>
            ))}
          </div>
        }
      >
        {/* View tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              background: view === v.id ? T.accent : T.card,
              color: view === v.id ? T.bg : T.text,
              border: `1px solid ${view === v.id ? T.accent : T.border}`,
              borderRadius: 8, padding: '8px 16px', fontSize: 12, fontFamily: T.font,
              fontWeight: view === v.id ? 'bold' : 'normal', cursor: 'pointer',
            }}>{v.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Chart */}
          <Card>
            <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12 }}>
              LANZAMIENTOS Y GOLES
            </div>
            {chartData.length > 0 ? (
              <HBarChart
                data={chartData}
                dataKeys={[
                  { key: 'Paradas', name: 'Paradas', color: T.accent, stack: 'a' },
                  { key: 'Goles',   name: 'Goles',   color: T.red,   stack: 'a' },
                ]}
                height={280}
              />
            ) : <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Sin datos</div>}
          </Card>

          {/* Efficacy chart */}
          <Card>
            <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12 }}>
              EFECTIVIDAD %
            </div>
            {chartData.length > 0 ? (
              <HBarChart
                data={chartData}
                dataKeys={[
                  { key: '% Gol',   name: '% Gol',    color: T.red },
                  { key: '% Parada', name: '% Parada', color: T.accent },
                ]}
                height={280}
              />
            ) : <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Sin datos</div>}
          </Card>
        </div>

        {/* Table */}
        {view !== 'infracc' && (
          <Card style={{ marginTop: 20 }}>
            <StatsTable rows={rows} emptyText="Sin lanzamientos registrados para este filtro" />
          </Card>
        )}

        {view === 'infracc' && rows.length > 0 && (
          <Card style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12 }}>RESUMEN DE INFRACCIONES</div>
            {rows.map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}22` }}>
                <span style={{ color: T.text }}>{r.label}</span>
                <span style={{ color: T.red, fontWeight: 'bold', fontFamily: T.font }}>{r.total}</span>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  )
}
