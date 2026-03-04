import { useState } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, Btn, T, PctBar } from '../components/ui/index.jsx'
import { VBarChart } from '../components/charts/StatsCharts.jsx'
import { generatePlayerAnalysis } from '../services/mvpEngine.js'

export const MVPPage = () => {
  const { activeStats } = useMatch()
  const [equipo, setEquipo] = useState('local')
  if (!activeStats) return null

  const ranking = equipo === 'local' ? activeStats.mvpLocal : activeStats.mvpVisitante
  const maxScore = Math.max(1, ...ranking.map(r => r.mvpScore))

  const chartData = ranking.slice(0, 8).map(r => ({
    name: r.jugador.nombre,
    Score: r.mvpScore,
    Goles: r.goles,
  }))

  return (
    <div>
      <Section title="Ranking MVP & Análisis Automático"
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
        {ranking.length === 0 ? (
          <Card><div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Sin datos suficientes para generar ranking MVP.</div></Card>
        ) : (
          <>
            {/* Chart */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12 }}>RANKING POR SCORE MVP</div>
              <VBarChart
                data={chartData}
                dataKeys={[
                  { key: 'Score', name: 'MVP Score', color: T.warn, cells: true },
                ]}
                height={200}
              />
            </Card>

            {/* Podium (top 3) */}
            {ranking.length >= 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 24 }}>
                {ranking.slice(0, 3).map((r, i) => (
                  <MVPCard key={r.jugador.id} stats={r} position={i + 1} maxScore={maxScore} />
                ))}
              </div>
            )}

            {/* Full ranking table */}
            <Card>
              <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12 }}>RANKING COMPLETO</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['#', 'Jugador', 'Score', 'Goles', 'Lanz.', '% Gol', 'Excl.', 'Puntos+', 'Puntos-'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', color: T.muted, fontWeight: 'normal', textAlign: h === 'Jugador' ? 'left' : 'center' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map(r => (
                      <tr key={r.jugador.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                        <td style={{ padding: '9px 10px', color: r.rank <= 3 ? T.warn : T.muted, fontWeight: 'bold', textAlign: 'center' }}>
                          {r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank - 1] : r.rank}
                        </td>
                        <td style={{ padding: '9px 10px', color: T.text, fontWeight: 'bold' }}>
                          {r.jugador.numero ? `#${r.jugador.numero} ` : ''}{r.jugador.nombre}
                        </td>
                        <td style={{ padding: '9px 10px', color: T.warn, fontWeight: 'bold', textAlign: 'center', fontFamily: T.font }}>{r.mvpScore}</td>
                        <td style={{ padding: '9px 10px', color: T.red, textAlign: 'center' }}>{r.goles}</td>
                        <td style={{ padding: '9px 10px', color: T.muted, textAlign: 'center' }}>{r.lanzamientos}</td>
                        <td style={{ padding: '9px 10px', color: T.accent, textAlign: 'center' }}>{r.eficacia}%</td>
                        <td style={{ padding: '9px 10px', color: T.red, textAlign: 'center' }}>{r.exclusiones}</td>
                        <td style={{ padding: '9px 10px', color: T.accent, textAlign: 'center', fontSize: 11 }}>
                          +{(r.mvpBreakdown?.goles || 0) + (r.mvpBreakdown?.contraataque || 0) + (r.mvpBreakdown?.distancia9m || 0)}
                        </td>
                        <td style={{ padding: '9px 10px', color: T.red, textAlign: 'center', fontSize: 11 }}>
                          {(r.mvpBreakdown?.exclusiones || 0) + (r.mvpBreakdown?.perdidas || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* AI Analysis section */}
            <Section title="Análisis Automático de Jugadores" action={null}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
                {ranking.slice(0, 6).map(r => {
                  const insights = generatePlayerAnalysis(r)
                  if (insights.length === 0) return null
                  return (
                    <Card key={r.jugador.id}>
                      <div style={{ fontSize: 13, fontWeight: 'bold', color: T.text, marginBottom: 10 }}>
                        {r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank - 1] : `#${r.rank}`} {r.jugador.nombre}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {insights.map((ins, i) => (
                          <div key={i} style={{
                            background: ins.startsWith('✅') ? `${T.accent}11` : ins.startsWith('⚠️') || ins.startsWith('🔴') ? `${T.red}11` : `${T.cyan}11`,
                            border: `1px solid ${ins.startsWith('✅') ? T.accent : ins.startsWith('⚠️') || ins.startsWith('🔴') ? T.red : T.cyan}33`,
                            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.text,
                          }}>{ins}</div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </Section>
          </>
        )}
      </Section>
    </div>
  )
}

// ── MVP podium card ───────────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = [T.warn, '#adb5bd', '#cd7f32']

const MVPCard = ({ stats: s, position, maxScore }) => {
  const color = MEDAL_COLORS[position - 1]
  const breakdown = s.mvpBreakdown || {}
  return (
    <Card style={{ borderColor: color, borderWidth: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 28 }}>{MEDALS[position - 1]}</div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: T.text, marginTop: 4 }}>
            {s.jugador.numero ? `#${s.jugador.numero} ` : ''}{s.jugador.nombre}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color, fontFamily: T.font }}>{s.mvpScore}</div>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1 }}>MVP SCORE</div>
        </div>
      </div>

      <PctBar value={(s.mvpScore / maxScore) * 100} color={color} height={4} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 10 }}>
        {[['Goles', s.goles, T.red], ['% Gol', `${s.eficacia}%`, T.accent], ['Excl.', s.exclusiones, s.exclusiones > 0 ? T.red : T.muted]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center', background: T.card2, borderRadius: 6, padding: '8px 4px' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: c, fontFamily: T.font }}>{v}</div>
            <div style={{ fontSize: 9, color: T.muted }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Score breakdown */}
      <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
        {breakdown.goles > 0 && <span style={{ color: T.red, marginRight: 6 }}>+{breakdown.goles} goles</span>}
        {breakdown.contraataque > 0 && <span style={{ color: T.accent, marginRight: 6 }}>+{breakdown.contraataque} cta</span>}
        {breakdown.exclusiones < 0 && <span style={{ color: T.red }}>{breakdown.exclusiones} excl</span>}
      </div>
    </Card>
  )
}
