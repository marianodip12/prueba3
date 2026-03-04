// ─── TEAM STATISTICS SERVICE ──────────────────────────────────────────────────
import { buildStatsRow, pct, efectividad } from '../utils/calculations.js'
import { soloLanzamientos, porEquipo, porCampo, buildTimeline } from '../utils/filters.js'
import {
  ZONAS_ATAQUE, DISTANCIAS, SITUACIONES_NUMERICAS, TIPOS_ATAQUE,
  TIPOS_EVENTO, RESULTADOS,
} from '../data/eventSchema.js'

/**
 * Compute all team statistics from a list of events.
 * @param {Array} eventos - All events in the match.
 * @param {string} equipo - 'local' | 'visitante'
 * @returns {Object} Complete team stats object.
 */
export const computeTeamStats = (eventos, equipo) => {
  const evs = porEquipo(eventos, equipo)
  const lanz = soloLanzamientos(evs)

  const goles      = lanz.filter(e => e.resultado === RESULTADOS.GOL).length
  const paradas    = lanz.filter(e => e.resultado === RESULTADOS.PARADA).length
  const postes     = lanz.filter(e => e.resultado === RESULTADOS.POSTE).length
  const fuera      = lanz.filter(e => e.resultado === RESULTADOS.FUERA).length
  const alArco     = goles + paradas

  // Infractions
  const exclusiones  = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.EXCLUSION).length
  const perdidas     = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PERDIDA).length
  const pasos        = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PASOS).length
  const lineas       = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.LINEA).length
  const timeouts     = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.TIMEOUT).length
  const golpesFrancos = evs.filter(e => e.tipoEvento === TIPOS_EVENTO.GOLPE_FRANCO).length

  // Attack breakdowns
  const contraataques   = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.CONTRAATAQUE)
  const posicionales    = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.POSICIONAL)
  const campoContrario  = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.CAMPO || e.distancia === DISTANCIAS.CAMPO)

  // By zone
  const porZona = Object.values(ZONAS_ATAQUE).map(zona => {
    const zEvs = lanz.filter(e => e.zonaAtaque === zona)
    return buildStatsRow(zona, zEvs)
  })

  // By distance
  const porDistancia = Object.values(DISTANCIAS).map(d => {
    const dEvs = lanz.filter(e => e.distancia === d)
    return buildStatsRow(d, dEvs)
  })

  // By numeric situation
  const porSituacion = Object.values(SITUACIONES_NUMERICAS).map(s => {
    const sEvs = lanz.filter(e => e.situacionNumerica === s)
    return buildStatsRow(s, sEvs)
  })

  // Timeline (events with minuto)
  const timeline = buildTimeline(evs, 5).map(bucket => {
    const bl  = soloLanzamientos(bucket.eventos)
    const bg  = bl.filter(e => e.resultado === RESULTADOS.GOL).length
    const bp  = bl.filter(e => e.resultado === RESULTADOS.PARADA).length
    return {
      min: bucket.min,
      goles: bg,
      lanzamientos: bl.length,
      eficacia: pct(bg, bl.length),
      efectividad: efectividad(bp, bg),
    }
  })

  return {
    equipo,
    // Totals
    totalEventos: evs.length,
    lanzamientos: lanz.length,
    goles,
    paradas,
    postes,
    fuera,
    alArco,
    eficacia: pct(goles, lanz.length),
    efectividad: efectividad(paradas, goles),
    // Infractions
    exclusiones,
    perdidas,
    pasos,
    lineas,
    timeouts,
    golpesFrancos,
    // Attack breakdowns
    contraataque: {
      total: contraataques.length,
      goles: contraataques.filter(e => e.resultado === RESULTADOS.GOL).length,
      eficacia: pct(contraataques.filter(e => e.resultado === RESULTADOS.GOL).length, contraataques.length),
    },
    posicional: {
      total: posicionales.length,
      goles: posicionales.filter(e => e.resultado === RESULTADOS.GOL).length,
      eficacia: pct(posicionales.filter(e => e.resultado === RESULTADOS.GOL).length, posicionales.length),
    },
    campoContrario: {
      total: campoContrario.length,
      goles: campoContrario.filter(e => e.resultado === RESULTADOS.GOL).length,
      eficacia: pct(campoContrario.filter(e => e.resultado === RESULTADOS.GOL).length, campoContrario.length),
    },
    // Breakdowns
    porZona,
    porDistancia,
    porSituacion,
    timeline,
  }
}
