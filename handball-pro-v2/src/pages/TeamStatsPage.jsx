import { useMemo } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, StatBox, StatsTable, T } from '../components/ui/index.jsx'
import { VBarChart, TimelineChart, DonutChart } from '../components/charts/StatsCharts.jsx'
import { LABELS } from '../data/eventSchema.js'

export const TeamStatsPage = () => {
  const { activeStats } = useMatch()
  if (!activeStats) return null

  const { teamLocal: L, teamVisitante: V } = activeStats

  return (
    <div>
      <Section title="Estadísticas de Equipo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <TeamPanel team={L} label="Local" color={T.accent} />
          <TeamPanel team={V} label={`Visitante`} color={T.red} />
        </div>
      </Section>

      {/* Head to head */}
      <Section title="Comparativa Local vs Visitante">
        <Card>
          <CompareChart local={L} visitante={V} />
        </Card>
      </Section>

      {/* Timeline */}
      <Section title="Evolución del Partido">
        <Card>
          <TimelineChart
            data={[...L.timeline, ...V.timeline]
              .reduce((acc, b) => {
                const existing = acc.find(x => x.min === b.min)
                if (existing) return acc
                const lBucket = L.timeline.find(x => x.min === b.min)
                const vBucket = V.timeline.find(x => x.min === b.min)
                acc.push({
                  min: b.min,
                  'Goles Local':     lBucket?.goles ?? 0,
                  'Goles Visitante': vBucket?.goles ?? 0,
                  '% Ef. Local':     lBucket?.eficacia ?? 0,
                })
                return acc
              }, [])
              .sort((a, b) => a.min - b.min)
            }
            dataKeys={[
              { key: 'Goles Local',     name: 'Goles Local',     color: T.accent },
              { key: 'Goles Visitante', name: 'Goles Visitante', color: T.red },
              { key: '% Ef. Local',     name: '% Eficacia Local', color: T.cyan, dashed: true },
            ]}
          />
        </Card>
      </Section>
    </div>
  )
}

const TeamPanel = ({ team: t, label, color }) => (
  <div>
    <div style={{ fontSize: 12, color, letterSpacing: 2, marginBottom: 12, fontWeight: 'bold' }}>
      ▸ EQUIPO {label.toUpperCase()}
    </div>

    {/* KPI row 1 */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
      <StatBox label="Goles"        value={t.goles}        color={color} />
      <StatBox label="Lanzamientos" value={t.lanzamientos} color={T.text} />
      <StatBox label="Al Arco"      value={t.alArco}       color={T.cyan} />
      <StatBox label="% Gol"        value={`${t.eficacia}%`}     color={t.eficacia >= 50 ? color : T.warn} />
      <StatBox label="% Parada Rival" value={`${t.efectividad}%`} color={T.muted} />
    </div>

    {/* KPI row 2 */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
      <StatBox label="Exclusiones"  value={t.exclusiones}  color={T.red} />
      <StatBox label="Pérdidas"     value={t.perdidas}     color={T.warn} />
      <StatBox label="Pasos"        value={t.pasos}        color={T.orange} />
      <StatBox label="Línea"        value={t.lineas}       color={T.orange} />
      <StatBox label="Timeouts"     value={t.timeouts}     color={T.muted} />
    </div>

    {/* Attack type breakdown */}
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 10 }}>TIPO DE ATAQUE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: '⚡ Contraataque', data: t.contraataque },
          { label: '🎯 Posicional',   data: t.posicional },
          { label: '🌍 Campo Contr.', data: t.campoContrario },
        ].map(({ label, data }) => (
          <div key={label} style={{ textAlign: 'center', background: T.card2, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color, fontFamily: T.font }}>{data.goles}</div>
            <div style={{ fontSize: 10, color: T.muted }}>{data.total} lanz · {data.eficacia}%</div>
          </div>
        ))}
      </div>
    </Card>

    {/* By zone */}
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 10 }}>POR ZONA DE ATAQUE</div>
      <StatsTable rows={t.porZona.map(r => ({ ...r, label: `Zona ${r.label} – ${LABELS.zonaAtaque[r.label]}` }))} />
    </Card>

    {/* By distance */}
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 10 }}>POR DISTANCIA</div>
      <StatsTable rows={t.porDistancia.map(r => ({ ...r, label: LABELS.distancia[r.label] }))} />
    </Card>

    {/* By numeric */}
    <Card>
      <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 10 }}>POR SITUACIÓN NUMÉRICA</div>
      <StatsTable rows={t.porSituacion.map(r => ({ ...r, label: LABELS.situacionNumerica[r.label] }))} />
    </Card>
  </div>
)

const CompareChart = ({ local: L, visitante: V }) => {
  const data = [
    { name: 'Goles',       Local: L.goles,       Visitante: V.goles },
    { name: 'Lanzamientos', Local: L.lanzamientos, Visitante: V.lanzamientos },
    { name: 'Al Arco',     Local: L.alArco,      Visitante: V.alArco },
    { name: 'Exclusiones', Local: L.exclusiones, Visitante: V.exclusiones },
    { name: 'Pérdidas',    Local: L.perdidas,    Visitante: V.perdidas },
  ]
  return (
    <VBarChart data={data} dataKeys={[
      { key: 'Local',     name: 'Local',     color: T.accent },
      { key: 'Visitante', name: 'Visitante', color: T.red },
    ]} />
  )
}
