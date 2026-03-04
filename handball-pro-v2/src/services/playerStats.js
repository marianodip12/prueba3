// ─── PLAYER STATISTICS SERVICE ───────────────────────────────────────────────
import { buildStatsRow, pct, efectividad, eventScore } from '../utils/calculations.js'
import { soloLanzamientos, porJugador, porCampo } from '../utils/filters.js'
import {
  ZONAS_ATAQUE, DISTANCIAS, SITUACIONES_NUMERICAS, TIPOS_ATAQUE,
  TIPOS_LANZAMIENTO, CUADRANTES_PORTERIA, TIPOS_EVENTO, RESULTADOS,
} from '../data/eventSchema.js'

/**
 * Compute statistics for a single player.
 * @param {Object} jugador - Player object { id, nombre, numero, posicion }
 * @param {Array}  eventos - All match events
 * @returns {Object} Complete player stats
 */
export const computePlayerStats = (jugador, eventos) => {
  const evs  = porJugador(eventos, jugador.id)
  const lanz = soloLanzamientos(evs)

  const goles      = lanz.filter(e => e.resultado === RESULTADOS.GOL).length
  const paradas    = lanz.filter(e => e.resultado === RESULTADOS.PARADA).length
  const postes     = lanz.filter(e => e.resultado === RESULTADOS.POSTE).length
  const fuera      = lanz.filter(e => e.resultado === RESULTADOS.FUERA).length
  const alArco     = goles + paradas

  const exclusiones    = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.EXCLUSION).length
  const perdidas       = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PERDIDA).length
  const pasos          = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PASOS).length
  const golpesFrancos  = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.GOLPE_FRANCO).length
  const campoContrario = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.CAMPO || e.distancia === DISTANCIAS.CAMPO).length

  // Score
  const score = evs.reduce((acc, e) => acc + eventScore(e), 0)

  // By zone of attack
  const porZona = Object.values(ZONAS_ATAQUE).map(zona => {
    const zEvs = lanz.filter(e => e.zonaAtaque === zona)
    return { ...buildStatsRow(zona, zEvs), zona }
  })

  // By goal quadrant
  const porCuadrante = Object.values(CUADRANTES_PORTERIA).map(q => {
    const qEvs = lanz.filter(e => e.cuadrantePorteria === q)
    return { ...buildStatsRow(q, qEvs), cuadrante: q }
  })

  // By launch type
  const porTipoLanzamiento = Object.values(TIPOS_LANZAMIENTO).map(t => {
    const tEvs = lanz.filter(e => e.tipoLanzamiento === t)
    return { ...buildStatsRow(t, tEvs), tipo: t }
  })

  // By attack type
  const porTipoAtaque = Object.values(TIPOS_ATAQUE).map(t => {
    const tEvs = lanz.filter(e => e.tipoAtaque === t)
    return { ...buildStatsRow(t, tEvs), tipo: t }
  })

  // By numeric situation
  const porSituacion = Object.values(SITUACIONES_NUMERICAS).map(s => {
    const sEvs = lanz.filter(e => e.situacionNumerica === s)
    return { ...buildStatsRow(s, sEvs), situacion: s }
  })

  // By distance
  const porDistancia = Object.values(DISTANCIAS).map(d => {
    const dEvs = lanz.filter(e => e.distancia === d)
    return { ...buildStatsRow(d, dEvs), distancia: d }
  })

  return {
    jugador,
    totalEventos: evs.length,
    lanzamientos: lanz.length,
    goles,
    paradas,
    postes,
    fuera,
    alArco,
    eficacia: pct(goles, lanz.length),
    efectividad: efectividad(paradas, goles),
    exclusiones,
    perdidas,
    pasos,
    golpesFrancos,
    campoContrario,
    score,
    porZona,
    porCuadrante,
    porTipoLanzamiento,
    porTipoAtaque,
    porSituacion,
    porDistancia,
  }
}

/**
 * Compute stats for all players in a team.
 * @param {Array} jugadores - Array of player objects
 * @param {Array} eventos   - All match events
 * @returns {Array} Sorted array of player stats (by score desc)
 */
export const computeAllPlayerStats = (jugadores, eventos) =>
  jugadores
    .map(j => computePlayerStats(j, eventos))
    .filter(s => s.totalEventos > 0)
    .sort((a, b) => b.score - a.score)
