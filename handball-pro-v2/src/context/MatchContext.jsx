import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { db } from '../services/supabase.js'
import { computeMatchStats } from '../services/statsEngine.js'

const MatchContext = createContext(null)

export const useMatch = () => {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used within MatchProvider')
  return ctx
}

const ACTIVE_KEY  = 'hb_active_match_id'
const loadActiveId = () => { try { return localStorage.getItem(ACTIVE_KEY) || null } catch { return null } }
const saveActiveId = id => { try { id ? localStorage.setItem(ACTIVE_KEY, id) : localStorage.removeItem(ACTIVE_KEY) } catch {} }

export const MatchProvider = ({ children }) => {
  const [matches,       setMatches]       = useState([])
  const [activeMatchId, setActiveMatchId] = useState(loadActiveId)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    setLoading(true)
    db.loadAll()
      .then(data => { setMatches(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const selectMatch = useCallback(id => {
    setActiveMatchId(id)
    saveActiveId(id)
  }, [])

  const createMatch = useCallback(async (data) => {
    try {
      const id = await db.createMatch(data)
      const newMatch = { id, ...data, jugadoresLocales: [], jugadoresVisitantes: [], porteros: [], eventos: [] }
      setMatches(prev => [newMatch, ...prev])
      selectMatch(id)
      return id
    } catch (e) { setError(e.message) }
  }, [selectMatch])

  const updateMatch = useCallback(async (id, data) => {
    try {
      await db.updateMatch(id, data)
      setMatches(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
    } catch (e) { setError(e.message) }
  }, [])

  const deleteMatch = useCallback(async (id) => {
    try {
      await db.deleteMatch(id)
      setMatches(prev => prev.filter(m => m.id !== id))
      if (activeMatchId === id) { setActiveMatchId(null); saveActiveId(null) }
    } catch (e) { setError(e.message) }
  }, [activeMatchId])

  const addEvento = useCallback(async (matchId, eventoData) => {
    try {
      const id = await db.addEvent(matchId, eventoData)
      const evento = { ...eventoData, id }
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, eventos: [...(m.eventos || []), evento] } : m
      ))
      return id
    } catch (e) { setError(e.message) }
  }, [])

  const deleteEvento = useCallback(async (matchId, eventoId) => {
    try {
      await db.deleteEvent(eventoId)
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, eventos: m.eventos.filter(e => e.id !== eventoId) } : m
      ))
    } catch (e) { setError(e.message) }
  }, [])

  const addJugador = useCallback(async (matchId, equipo, nombre, numero, posicion) => {
    try {
      const id = await db.addPlayer(matchId, equipo, nombre, numero, posicion)
      const jugador = { id, nombre, numero, posicion, equipo }
      const field = equipo === 'local' ? 'jugadoresLocales' : 'jugadoresVisitantes'
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, [field]: [...(m[field] || []), jugador] } : m
      ))
      return id
    } catch (e) { setError(e.message) }
  }, [])

  const removeJugador = useCallback(async (matchId, equipo, jugadorId) => {
    try {
      await db.deletePlayer(jugadorId)
      const field = equipo === 'local' ? 'jugadoresLocales' : 'jugadoresVisitantes'
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, [field]: m[field].filter(j => j.id !== jugadorId) } : m
      ))
    } catch (e) { setError(e.message) }
  }, [])

  const addPortero = useCallback(async (matchId, nombre, equipo) => {
    try {
      const id = await db.addGoalkeeper(matchId, nombre, equipo)
      const portero = { id, nombre, equipo }
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, porteros: [...(m.porteros || []), portero] } : m
      ))
      return id
    } catch (e) { setError(e.message) }
  }, [])

  const activeMatch = useMemo(
    () => matches.find(m => m.id === activeMatchId) || null,
    [matches, activeMatchId]
  )

  const activeStats = useMemo(
    () => activeMatch ? computeMatchStats(activeMatch) : null,
    [activeMatch]
  )

  const exportCSV = useCallback((matchId) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    const headers = ['id','equipo','jugadorId','tipoEvento','resultado','distancia',
      'zonaAtaque','cuadrantePorteria','tipoLanzamiento','tipoAtaque','situacionNumerica','minuto','porteroId']
    const rows = match.eventos.map(e => headers.map(h => e[h] ?? '').join(','))
    const csv  = [headers.join(','), ...rows].join('\n')
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `handball_${match.rival || 'match'}_${match.fecha}.csv`
    a.click()
  }, [matches])

  return (
    <MatchContext.Provider value={{
      matches, activeMatch, activeMatchId, activeStats, loading, error,
      selectMatch, createMatch, updateMatch, deleteMatch,
      addEvento, deleteEvento, addJugador, removeJugador, addPortero, exportCSV,
    }}>
      {children}
    </MatchContext.Provider>
  )
}
