import { useState, useCallback } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, Btn, FormInput, ChipGroup, Modal, T, StatBox } from '../components/ui/index.jsx'
import {
  TIPOS_EVENTO, RESULTADOS, DISTANCIAS, ZONAS_ATAQUE, CUADRANTES_PORTERIA,
  TIPOS_LANZAMIENTO, TIPOS_ATAQUE, SITUACIONES_NUMERICAS, EQUIPOS, LABELS,
  emptyEvent,
} from '../data/eventSchema.js'

const makeOptions = (obj, labels) =>
  Object.values(obj).map(v => ({ value: v, label: labels[v] }))

const RESULTADO_COLORS = { gol: T.red, parada: T.accent, poste: T.warn, fuera: T.muted }

export const RegisterPage = () => {
  const { activeMatch, addEvento, deleteEvento, exportCSV, addJugador, addPortero, removeJugador } = useMatch()
  const [form, setForm] = useState({ ...emptyEvent(), equipo: 'local' })
  const [showRoster, setShowRoster] = useState(false)

  if (!activeMatch) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const eventos = activeMatch.eventos || []
  const isLanzamiento = form.tipoEvento === TIPOS_EVENTO.LANZAMIENTO

  const submit = () => {
    if (!form.equipo || !form.tipoEvento || !form.situacionNumerica) {
      alert('Completa los campos obligatorios: equipo, tipo de evento y situación numérica')
      return
    }
    if (isLanzamiento && (!form.zonaAtaque || !form.distancia || !form.resultado)) {
      alert('Para lanzamientos: completa zona, distancia y resultado')
      return
    }
    addEvento(activeMatch.id, { ...form })
    // Keep context fields for next event
    setForm(f => ({
      ...emptyEvent(),
      equipo: f.equipo,
      situacionNumerica: f.situacionNumerica,
      tipoAtaque: f.tipoAtaque,
      minuto: f.minuto,
    }))
  }

  const golesLocal     = eventos.filter(e => e.equipo === 'local'     && e.resultado === 'gol').length
  const golesVisitante = eventos.filter(e => e.equipo === 'visitante' && e.resultado === 'gol').length

  const jugadores = form.equipo === 'local'
    ? activeMatch.jugadoresLocales || []
    : activeMatch.jugadoresVisitantes || []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
      {/* LEFT: Form */}
      <div>
        {/* Scoreboard */}
        <Card style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '16px 24px', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1 }}>LOCAL</div>
            <div style={{ fontSize: 40, fontWeight: 'bold', color: T.accent, fontFamily: T.font }}>{golesLocal}</div>
          </div>
          <div style={{ fontSize: 18, color: T.border }}>—</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1 }}>VISITANTE ({activeMatch.rival})</div>
            <div style={{ fontSize: 40, fontWeight: 'bold', color: T.red, fontFamily: T.font }}>{golesVisitante}</div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {/* Column 1 */}
            <div>
              <ChipGroup label="Equipo *"
                options={makeOptions(EQUIPOS, LABELS.equipo)}
                value={form.equipo} onChange={v => set('equipo', v)} />

              <ChipGroup label="Tipo de Evento *"
                options={makeOptions(TIPOS_EVENTO, LABELS.tipoEvento)}
                value={form.tipoEvento} onChange={v => set('tipoEvento', v)} />

              <ChipGroup label="Situación Numérica *"
                options={makeOptions(SITUACIONES_NUMERICAS, LABELS.situacionNumerica)}
                value={form.situacionNumerica} onChange={v => set('situacionNumerica', v)} />

              <ChipGroup label="Tipo de Ataque"
                options={makeOptions(TIPOS_ATAQUE, LABELS.tipoAtaque)}
                value={form.tipoAtaque} onChange={v => set('tipoAtaque', v)} />

              <FormInput label="Minuto" type="number" value={form.minuto}
                onChange={v => set('minuto', v)} placeholder="ej. 23" />
            </div>

            {/* Column 2 — conditional on lanzamiento */}
            <div>
              {/* Jugador selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>JUGADOR</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {jugadores.map(j => (
                    <button key={j.id} onClick={() => set('jugadorId', form.jugadorId === j.id ? '' : j.id)} style={{
                      background: form.jugadorId === j.id ? T.cyan : T.card2,
                      color: form.jugadorId === j.id ? T.bg : T.text,
                      border: `1px solid ${form.jugadorId === j.id ? T.cyan : T.border}`,
                      borderRadius: 8, padding: '6px 10px', fontSize: 11, fontFamily: T.font, cursor: 'pointer',
                    }}>
                      {j.numero ? `#${j.numero} ` : ''}{j.nombre}
                    </button>
                  ))}
                  <Btn small variant="ghost" onClick={() => setShowRoster(true)}>+ Gestionar</Btn>
                </div>
              </div>

              {isLanzamiento && (
                <>
                  <ChipGroup label="Zona de Ataque *"
                    options={makeOptions(ZONAS_ATAQUE, LABELS.zonaAtaque)}
                    value={form.zonaAtaque} onChange={v => set('zonaAtaque', v)} />

                  <ChipGroup label="Distancia *"
                    options={makeOptions(DISTANCIAS, LABELS.distancia)}
                    value={form.distancia} onChange={v => set('distancia', v)} />

                  <ChipGroup label="Tipo de Lanzamiento"
                    options={makeOptions(TIPOS_LANZAMIENTO, LABELS.tipoLanzamiento)}
                    value={form.tipoLanzamiento} onChange={v => set('tipoLanzamiento', v)} />

                  {/* Goal quadrant */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>CUADRANTE PORTERÍA</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 4, maxWidth: 200 }}>
                      {[CUADRANTES_PORTERIA.SUP_IZQ, CUADRANTES_PORTERIA.SUP_DER,
                        CUADRANTES_PORTERIA.INF_IZQ, CUADRANTES_PORTERIA.INF_DER].map(q => (
                        <button key={q} onClick={() => set('cuadrantePorteria', form.cuadrantePorteria === q ? '' : q)} style={{
                          background: form.cuadrantePorteria === q ? T.accent : T.card2,
                          color: form.cuadrantePorteria === q ? T.bg : T.text,
                          border: `1px solid ${form.cuadrantePorteria === q ? T.accent : T.border}`,
                          borderRadius: 6, padding: '9px 4px', fontSize: 10, fontFamily: T.font, cursor: 'pointer',
                        }}>{LABELS.cuadrantePorteria[q]}</button>
                      ))}
                    </div>
                    <button onClick={() => set('cuadrantePorteria', form.cuadrantePorteria === CUADRANTES_PORTERIA.CENTRO ? '' : CUADRANTES_PORTERIA.CENTRO)} style={{
                      marginTop: 4, width: '100%', maxWidth: 200, background: form.cuadrantePorteria === CUADRANTES_PORTERIA.CENTRO ? T.accent : T.card2,
                      color: form.cuadrantePorteria === CUADRANTES_PORTERIA.CENTRO ? T.bg : T.text,
                      border: `1px solid ${form.cuadrantePorteria === CUADRANTES_PORTERIA.CENTRO ? T.accent : T.border}`,
                      borderRadius: 6, padding: '9px', fontSize: 10, fontFamily: T.font, cursor: 'pointer',
                    }}>• Centro</button>
                  </div>

                  {/* Portero selector */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>PORTERO RIVAL</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(activeMatch.porteros || []).map(p => (
                        <button key={p.id} onClick={() => set('porteroId', form.porteroId === p.id ? '' : p.id)} style={{
                          background: form.porteroId === p.id ? T.warn : T.card2,
                          color: form.porteroId === p.id ? T.bg : T.text,
                          border: `1px solid ${form.porteroId === p.id ? T.warn : T.border}`,
                          borderRadius: 8, padding: '6px 10px', fontSize: 11, fontFamily: T.font, cursor: 'pointer',
                        }}>🧤 {p.nombre}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Result selector */}
          {isLanzamiento && (
            <div style={{ marginTop: 4, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 8 }}>RESULTADO *</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {makeOptions(RESULTADOS, LABELS.resultado).map(({ value, label }) => (
                  <button key={value} onClick={() => set('resultado', form.resultado === value ? '' : value)} style={{
                    flex: 1, background: form.resultado === value ? (RESULTADO_COLORS[value] || T.accent) : T.card2,
                    color: form.resultado === value ? (value === 'parada' ? T.bg : T.text) : T.text,
                    border: `1px solid ${form.resultado === value ? (RESULTADO_COLORS[value] || T.accent) : T.border}`,
                    borderRadius: 8, padding: '13px 4px', fontFamily: T.font, fontSize: 12,
                    fontWeight: 'bold', cursor: 'pointer',
                  }}>
                    {value === 'gol' ? '🥅' : value === 'parada' ? '🧤' : value === 'poste' ? '🔕' : '↗'} {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Btn style={{ width: '100%', padding: 14, fontSize: 14 }} onClick={submit}>
            ⚡ REGISTRAR EVENTO  ({eventos.length} registrados)
          </Btn>
        </Card>
      </div>

      {/* RIGHT: Event log */}
      <div>
        <Section title="Últimos Eventos"
          action={
            <Btn small variant="secondary" onClick={() => exportCSV(activeMatch.id)}>📥 CSV</Btn>
          }
        >
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowY: 'auto', maxHeight: 580 }}>
              {eventos.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 12 }}>
                  Sin eventos registrados aún
                </div>
              )}
              {[...eventos].reverse().slice(0, 50).map((e, i) => (
                <EventRow key={e.id} evento={e} index={eventos.length - i}
                  onDelete={() => deleteEvento(activeMatch.id, e.id)} />
              ))}
            </div>
          </Card>
        </Section>
      </div>

      {/* Roster modal */}
      {showRoster && (
        <RosterModal match={activeMatch} onClose={() => setShowRoster(false)}
          addJugador={addJugador} addPortero={addPortero} removeJugador={removeJugador} />
      )}
    </div>
  )
}

// ── Event row ─────────────────────────────────────────────────────────────────
const RESULT_C = { gol: T.red, parada: T.accent, poste: T.warn, fuera: T.muted }

const EventRow = ({ evento: e, index, onDelete }) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: `1px solid ${T.border}22`, gap: 8 }}>
    <span style={{ fontSize: 10, color: T.muted, minWidth: 26 }}>#{index}</span>
    <span style={{ fontSize: 10, color: e.equipo === 'local' ? T.accent : T.red, minWidth: 18 }}>
      {e.equipo === 'local' ? 'L' : 'V'}
    </span>
    <span style={{ fontSize: 11, color: T.text, flex: 1 }}>
      {LABELS.tipoEvento[e.tipoEvento] || e.tipoEvento}
      {e.zonaAtaque && ` · Z${e.zonaAtaque}`}
      {e.distancia && ` · ${e.distancia}`}
    </span>
    {e.resultado && (
      <span style={{
        fontSize: 11, fontWeight: 'bold', color: RESULT_C[e.resultado],
        background: `${RESULT_C[e.resultado]}22`, borderRadius: 4, padding: '2px 7px',
      }}>{LABELS.resultado[e.resultado]}</span>
    )}
    {e.minuto && <span style={{ fontSize: 10, color: T.muted }}>{e.minuto}'</span>}
    <button onClick={onDelete} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 15, padding: 2 }}>×</button>
  </div>
)

// ── Roster modal ──────────────────────────────────────────────────────────────
const RosterModal = ({ match, onClose, addJugador, addPortero, removeJugador }) => {
  const [tab, setTab] = useState('local')
  const [name, setName] = useState('')
  const [num, setNum] = useState('')
  const [pos, setPos] = useState('')
  const [gkName, setGkName] = useState('')
  const [gkTeam, setGkTeam] = useState('local')

  const handleAdd = () => {
    if (!name.trim()) return
    addJugador(match.id, tab, name.trim(), num, pos)
    setName(''); setNum(''); setPos('')
  }
  const handleAddGK = () => {
    if (!gkName.trim()) return
    addPortero(match.id, gkName.trim(), gkTeam)
    setGkName('')
  }

  const jugadores = tab === 'local' ? match.jugadoresLocales || [] : match.jugadoresVisitantes || []

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <Card style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: T.accent, fontSize: 14, letterSpacing: 2 }}>GESTIÓN DE PLANTILLA</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {/* Team tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['local', 'visitante'].map(t => (
            <Btn key={t} small variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>
              {t === 'local' ? '🏠 Local' : '✈️ Visitante'}
            </Btn>
          ))}
        </div>

        {/* Add player */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px auto', gap: 8, marginBottom: 12 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del jugador"
            style={{ background: T.card2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: T.font }} />
          <input value={num} onChange={e => setNum(e.target.value)} placeholder="#"
            style={{ background: T.card2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: T.font }} />
          <input value={pos} onChange={e => setPos(e.target.value)} placeholder="Pos"
            style={{ background: T.card2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: T.font }} />
          <Btn small onClick={handleAdd}>+ Add</Btn>
        </div>

        {/* Player list */}
        <div style={{ marginBottom: 20 }}>
          {jugadores.length === 0 && <div style={{ color: T.muted, fontSize: 12, padding: '8px 0' }}>Sin jugadores añadidos</div>}
          {jugadores.map(j => (
            <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: T.card2, borderRadius: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: T.text }}>{j.numero ? `#${j.numero} · ` : ''}{j.nombre}{j.posicion ? ` (${j.posicion})` : ''}</span>
              <Btn small variant="danger" onClick={() => removeJugador(match.id, tab, j.id)}>×</Btn>
            </div>
          ))}
        </div>

        {/* Porteros section */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: T.accent, letterSpacing: 2, marginBottom: 10 }}>PORTEROS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, marginBottom: 10 }}>
            <input value={gkName} onChange={e => setGkName(e.target.value)} placeholder="Nombre portero"
              style={{ background: T.card2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: T.font }} />
            <select value={gkTeam} onChange={e => setGkTeam(e.target.value)}
              style={{ background: T.card2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: T.font }}>
              <option value="local">Local</option>
              <option value="visitante">Visitante</option>
            </select>
            <Btn small onClick={handleAddGK}>+ Add</Btn>
          </div>
          {(match.porteros || []).map(p => (
            <div key={p.id} style={{ fontSize: 12, color: T.text, padding: '6px 12px', background: T.card2, borderRadius: 6, marginBottom: 4 }}>
              🧤 {p.nombre} · {p.equipo}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
