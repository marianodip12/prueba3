import { createClient } from '@supabase/supabase-js'

// ─── CLIENT ───────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://viecdsenxfrctcnubuor.supabase.co'
const SUPABASE_PUB_KEY = 'sb_publishable_2StHifRz7zzMubeCRkWW6Q_9maqGw34'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUB_KEY)

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const handle = (data, error, label) => {
  if (error) { console.error(`[Supabase] ${label}:`, error.message); throw error }
  return data
}

// ─── MATCHES ──────────────────────────────────────────────────────────────────

export const db = {

  // Load all matches with their nested players, goalkeepers, and events
  async loadAll() {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        players(*),
        goalkeepers(*),
        events(*)
      `)
      .order('created_at', { ascending: false })
    handle(matches, error, 'loadAll')

    // Reshape DB rows → app model
    return matches.map(m => ({
      id:                  m.id,
      rival:               m.rival,
      fecha:               m.fecha,
      competicion:         m.competicion,
      temporada:           m.temporada,
      sede:                m.sede,
      jugadoresLocales:    (m.players || []).filter(p => p.equipo === 'local').map(mapPlayer),
      jugadoresVisitantes: (m.players || []).filter(p => p.equipo === 'visitante').map(mapPlayer),
      porteros:            (m.goalkeepers || []).map(mapGoalkeeper),
      eventos:             (m.events || []).map(mapEvent),
    }))
  },

  // ── Match CRUD ──────────────────────────────────────────────────────────────

  async createMatch(data) {
    const { data: row, error } = await supabase
      .from('matches')
      .insert({
        rival:       data.rival,
        fecha:       data.fecha       || null,
        competicion: data.competicion || null,
        temporada:   data.temporada   || null,
        sede:        data.sede        || 'local',
      })
      .select()
      .single()
    handle(row, error, 'createMatch')
    return row.id
  },

  async updateMatch(id, data) {
    const { error } = await supabase
      .from('matches')
      .update({
        rival:       data.rival,
        fecha:       data.fecha       || null,
        competicion: data.competicion || null,
        temporada:   data.temporada   || null,
        sede:        data.sede        || 'local',
      })
      .eq('id', id)
    handle(null, error, 'updateMatch')
  },

  async deleteMatch(id) {
    // Cascade deletes players, goalkeepers, events automatically
    const { error } = await supabase.from('matches').delete().eq('id', id)
    handle(null, error, 'deleteMatch')
  },

  // ── Events ──────────────────────────────────────────────────────────────────

  async addEvent(matchId, evt) {
    const { data: row, error } = await supabase
      .from('events')
      .insert({
        match_id:           matchId,
        equipo:             evt.equipo             || null,
        jugador_id:         evt.jugadorId          || null,
        portero_id:         evt.porteroId          || null,
        tipo_evento:        evt.tipoEvento         || null,
        resultado:          evt.resultado          || null,
        distancia:          evt.distancia          || null,
        zona_ataque:        evt.zonaAtaque         || null,
        cuadrante_porteria: evt.cuadrantePorteria  || null,
        tipo_lanzamiento:   evt.tipoLanzamiento    || null,
        tipo_ataque:        evt.tipoAtaque         || null,
        situacion_numerica: evt.situacionNumerica  || null,
        minuto:             evt.minuto !== '' && evt.minuto !== null ? Number(evt.minuto) : null,
      })
      .select()
      .single()
    handle(row, error, 'addEvent')
    return row.id
  },

  async deleteEvent(eventId) {
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    handle(null, error, 'deleteEvent')
  },

  // ── Players ─────────────────────────────────────────────────────────────────

  async addPlayer(matchId, equipo, nombre, numero, posicion) {
    const { data: row, error } = await supabase
      .from('players')
      .insert({ match_id: matchId, equipo, nombre, numero: numero || null, posicion: posicion || null })
      .select()
      .single()
    handle(row, error, 'addPlayer')
    return row.id
  },

  async deletePlayer(playerId) {
    const { error } = await supabase.from('players').delete().eq('id', playerId)
    handle(null, error, 'deletePlayer')
  },

  // ── Goalkeepers ─────────────────────────────────────────────────────────────

  async addGoalkeeper(matchId, nombre, equipo) {
    const { data: row, error } = await supabase
      .from('goalkeepers')
      .insert({ match_id: matchId, nombre, equipo })
      .select()
      .single()
    handle(row, error, 'addGoalkeeper')
    return row.id
  },

  async deleteGoalkeeper(gkId) {
    const { error } = await supabase.from('goalkeepers').delete().eq('id', gkId)
    handle(null, error, 'deleteGoalkeeper')
  },
}

// ─── ROW MAPPERS (DB → App model) ─────────────────────────────────────────────

const mapPlayer = p => ({
  id:       p.id,
  nombre:   p.nombre,
  numero:   p.numero,
  posicion: p.posicion,
  equipo:   p.equipo,
})

const mapGoalkeeper = g => ({
  id:     g.id,
  nombre: g.nombre,
  equipo: g.equipo,
})

const mapEvent = e => ({
  id:                 e.id,
  equipo:             e.equipo,
  jugadorId:          e.jugador_id,
  porteroId:          e.portero_id,
  tipoEvento:         e.tipo_evento,
  resultado:          e.resultado,
  distancia:          e.distancia,
  zonaAtaque:         e.zona_ataque,
  cuadrantePorteria:  e.cuadrante_porteria,
  tipoLanzamiento:    e.tipo_lanzamiento,
  tipoAtaque:         e.tipo_ataque,
  situacionNumerica:  e.situacion_numerica,
  minuto:             e.minuto,
})
