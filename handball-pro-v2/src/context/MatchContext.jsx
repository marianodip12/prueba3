import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { computeMatchStats } from '../services/statsEngine.js'
import { emptyMatch } from '../data/eventSchema.js'

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'handball_pro_v2'

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { matches: [] } }
  catch { return { matches: [] } }
}

const persist = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const MatchContext = createContext(null)

export const useMatch = () => {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used within MatchProvider')
  return ctx
}

// ─── ID GENERATOR ─────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// ─── PROVIDER ─────────────────────────────────────────────────────────────────
export const MatchProvider = ({ children }) => {
  const [state, setState] = useState(load)
  const [activeMatchId, setActiveMatchId] = useState(() => load().activeMatchId || null)

  const save = useCallback((newState) => {
    setState(newState)
    persist(newState)
  }, [])

  // ── Match CRUD ──────────────────────────────────────────────────────────────

  const createMatch = useCallback((data) => {
    const match = { ...emptyMatch(), ...data, id: genId(), eventos: [] }
    const next = { ...state, matches: [...state.matches, match] }
    save(next)
    return match.id
  }, [state, save])

  const updateMatch = useCallback((id, data) => {
    const next = {
      ...state,
      matches: state.matches.map(m => m.id === id ? { ...m, ...data } : m),
    }
    save(next)
  }, [state, save])

  const deleteMatch = useCallback((id) => {
    const next = { ...state, matches: state.matches.filter(m => m.id !== id) }
    if (activeMatchId === id) setActiveMatchId(null)
    save(next)
  }, [state, save, activeMatchId])

  const selectMatch = useCallback((id) => {
    setActiveMatchId(id)
    persist({ ...state, activeMatchId: id })
  }, [state])

  // ── Event CRUD ──────────────────────────────────────────────────────────────

  const addEvento = useCallback((matchId, eventoData) => {
    const evento = { ...eventoData, id: genId() }
    const next = {
      ...state,
      matches: state.matches.map(m =>
        m.id === matchId
          ? { ...m, eventos: [...(m.eventos || []), evento] }
          : m
      ),
    }
    save(next)
    return evento.id
  }, [state, save])

  const deleteEvento = useCallback((matchId, eventoId) => {
    const next = {
      ...state,
      matches: state.matches.map(m =>
        m.id === matchId
          ? { ...m, eventos: m.eventos.filter(e => e.id !== eventoId) }
          : m
      ),
    }
    save(next)
  }, [state, save])

  const updateEvento = useCallback((matchId, eventoId, data) => {
    const next = {
      ...state,
      matches: state.matches.map(m =>
        m.id === matchId
          ? { ...m, eventos: m.eventos.map(e => e.id === eventoId ? { ...e, ...data } : e) }
          : m
      ),
    }
    save(next)
  }, [state, save])

  // ── Roster management ───────────────────────────────────────────────────────

  const addJugador = useCallback((matchId, equipo, nombre, numero, posicion) => {
    const jugador = { id: genId(), nombre, numero, posicion }
    const field = equipo === 'local' ? 'jugadoresLocales' : 'jugadoresVisitantes'
    const match = state.matches.find(m => m.id === matchId)
    if (!match) return
    updateMatch(matchId, { [field]: [...(match[field] || []), jugador] })
    return jugador.id
  }, [state, updateMatch])

  const addPortero = useCallback((matchId, nombre, equipo) => {
    const portero = { id: genId(), nombre, equipo }
    const match = state.matches.find(m => m.id === matchId)
    if (!match) return
    updateMatch(matchId, { porteros: [...(match.porteros || []), portero] })
    return portero.id
  }, [state, updateMatch])

  const removeJugador = useCallback((matchId, equipo, jugadorId) => {
    const field = equipo === 'local' ? 'jugadoresLocales' : 'jugadoresVisitantes'
    const match = state.matches.find(m => m.id === matchId)
    if (!match) return
    updateMatch(matchId, { [field]: match[field].filter(j => j.id !== jugadorId) })
  }, [state, updateMatch])

  // ── Derived data ────────────────────────────────────────────────────────────

  const activeMatch = useMemo(
    () => state.matches.find(m => m.id === activeMatchId) || null,
    [state.matches, activeMatchId]
  )

  const activeStats = useMemo(
    () => activeMatch ? computeMatchStats(activeMatch) : null,
    [activeMatch]
  )

  // ── CSV Export ──────────────────────────────────────────────────────────────

  const exportCSV = useCallback((matchId) => {
    const match = state.matches.find(m => m.id === matchId)
    if (!match) return
    const headers = ['id','equipo','jugadorId','tipoEvento','resultado','distancia','zonaAtaque','cuadrantePorteria','tipoLanzamiento','tipoAtaque','situacionNumerica','minuto','porteroId']
    const rows = match.eventos.map(e => headers.map(h => e[h] ?? '').join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `handball_${match.rival || 'match'}_${match.fecha}.csv`
    a.click()
  }, [state])

  return (
    <MatchContext.Provider value={{
      matches: state.matches,
      activeMatch,
      activeMatchId,
      activeStats,
      selectMatch,
      createMatch,
      updateMatch,
      deleteMatch,
      addEvento,
      deleteEvento,
      updateEvento,
      addJugador,
      addPortero,
      removeJugador,
      exportCSV,
    }}>
      {children}
    </MatchContext.Provider>
  )
}
