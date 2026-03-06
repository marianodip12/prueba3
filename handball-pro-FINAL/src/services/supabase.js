import { createClient } from '@supabase/supabase-js'

const URL = 'https://viecdsenxfrctcnubuor.supabase.co'
const KEY = 'sb_publishable_2StHifRz7zzMubeCRkWW6Q_9maqGw34'

export const supabase = createClient(URL, KEY)

const ok = (data, error, tag) => {
  if (error) { console.error('[DB]', tag, error.message); throw error }
  return data
}

export const db = {
  async loadAll() {
    const { data, error } = await supabase
      .from('matches')
      .select('*, players(*), goalkeepers(*), events(*)')
      .order('created_at', { ascending: false })
    ok(data, error, 'loadAll')
    return data.map(m => ({
      id: m.id, rival: m.rival, fecha: m.fecha,
      competicion: m.competicion, temporada: m.temporada, sede: m.sede,
      jugadoresLocales:    (m.players    || []).filter(p => p.equipo === 'local').map(mapP),
      jugadoresVisitantes: (m.players    || []).filter(p => p.equipo === 'visitante').map(mapP),
      porteros:            (m.goalkeepers|| []).map(mapG),
      eventos:             (m.events     || []).map(mapE),
    }))
  },

  async createMatch(d) {
    const { data, error } = await supabase.from('matches')
      .insert({ rival: d.rival, fecha: d.fecha||null, competicion: d.competicion||null, temporada: d.temporada||null, sede: d.sede||'local' })
      .select().single()
    return ok(data, error, 'createMatch').id
  },

  async updateMatch(id, d) {
    const { error } = await supabase.from('matches')
      .update({ rival: d.rival, fecha: d.fecha||null, competicion: d.competicion||null, temporada: d.temporada||null, sede: d.sede||'local' })
      .eq('id', id)
    ok(null, error, 'updateMatch')
  },

  async deleteMatch(id) {
    const { error } = await supabase.from('matches').delete().eq('id', id)
    ok(null, error, 'deleteMatch')
  },

  async addEvent(matchId, e) {
    const { data, error } = await supabase.from('events')
      .insert({
        match_id: matchId, equipo: e.equipo||null, jugador_id: e.jugadorId||null,
        portero_id: e.porteroId||null, tipo_evento: e.tipoEvento||null,
        resultado: e.resultado||null, distancia: e.distancia||null,
        zona_ataque: e.zonaAtaque||null, cuadrante_porteria: e.cuadrantePorteria||null,
        tipo_lanzamiento: e.tipoLanzamiento||null, tipo_ataque: e.tipoAtaque||null,
        situacion_numerica: e.situacionNumerica||null,
        minuto: e.minuto !== '' && e.minuto != null ? Number(e.minuto) : null,
      }).select().single()
    return ok(data, error, 'addEvent').id
  },

  async deleteEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    ok(null, error, 'deleteEvent')
  },

  async addPlayer(matchId, equipo, nombre, numero, posicion) {
    const { data, error } = await supabase.from('players')
      .insert({ match_id: matchId, equipo, nombre, numero: numero||null, posicion: posicion||null })
      .select().single()
    return ok(data, error, 'addPlayer').id
  },

  async deletePlayer(id) {
    const { error } = await supabase.from('players').delete().eq('id', id)
    ok(null, error, 'deletePlayer')
  },

  async addGoalkeeper(matchId, nombre, equipo) {
    const { data, error } = await supabase.from('goalkeepers')
      .insert({ match_id: matchId, nombre, equipo })
      .select().single()
    return ok(data, error, 'addGoalkeeper').id
  },

  async deleteGoalkeeper(id) {
    const { error } = await supabase.from('goalkeepers').delete().eq('id', id)
    ok(null, error, 'deleteGoalkeeper')
  },
}

const mapP = p => ({ id: p.id, nombre: p.nombre, numero: p.numero, posicion: p.posicion, equipo: p.equipo })
const mapG = g => ({ id: g.id, nombre: g.nombre, equipo: g.equipo })
const mapE = e => ({
  id: e.id, equipo: e.equipo, jugadorId: e.jugador_id, porteroId: e.portero_id,
  tipoEvento: e.tipo_evento, resultado: e.resultado, distancia: e.distancia,
  zonaAtaque: e.zona_ataque, cuadrantePorteria: e.cuadrante_porteria,
  tipoLanzamiento: e.tipo_lanzamiento, tipoAtaque: e.tipo_ataque,
  situacionNumerica: e.situacion_numerica, minuto: e.minuto,
})
