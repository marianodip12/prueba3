// ─── GOALKEEPER STATISTICS SERVICE ───────────────────────────────────────────
import { buildStatsRow, pct, efectividad, ratingLabel } from '../utils/calculations.js'
import { soloLanzamientos, porPortero } from '../utils/filters.js'
import {
  CUADRANTES_PORTERIA, DISTANCIAS, ZONAS_ATAQUE,
  TIPOS_LANZAMIENTO, TIPOS_ATAQUE, SITUACIONES_NUMERICAS, RESULTADOS,
} from '../data/eventSchema.js'

/**
 * Compute goalkeeper statistics from events directed at them.
 * Goalkeeper events use porteroId field on lanzamiento events.
 *
 * @param {Object} portero - { id, nombre }
 * @param {Array}  eventos - All match events
 * @returns {Object} Complete goalkeeper stats
 */
export const computeGoalkeeperStats = (portero, eventos) => {
  const evs    = porPortero(eventos, portero.id)
  const lanz   = soloLanzamientos(evs)

  const goles  = lanz.filter(e => e.resultado === RESULTADOS.GOL).length
  const paradas = lanz.filter(e => e.resultado === RESULTADOS.PARADA).length
  const postes  = lanz.filter(e => e.resultado === RESULTADOS.POSTE).length
  const fuera   = lanz.filter(e => e.resultado === RESULTADOS.FUERA).length
  const alArco  = goles + paradas
  const ef      = efectividad(paradas, goles)

  // Auto rating (0–100 weighted score)
  // Weights: effectiveness (50%), total shots volume (20%), stops on hard shots (30%)
  const hardShots = lanz.filter(e => e.distancia === DISTANCIAS.NUEVE || e.tipoAtaque === TIPOS_ATAQUE.CONTRAATAQUE)
  const hardParadas = hardShots.filter(e => e.resultado === RESULTADOS.PARADA).length
  const hardEf = efectividad(hardParadas, hardShots.filter(e => e.resultado === RESULTADOS.GOL).length)
  const volumeScore = Math.min(lanz.length * 2, 20)
  const valoracion = Math.round(ef * 0.5 + hardEf * 0.3 + volumeScore)

  // By goal quadrant (heatmap)
  const porCuadrante = Object.values(CUADRANTES_PORTERIA).map(q => {
    const qEvs = lanz.filter(e => e.cuadrantePorteria === q)
    return { ...buildStatsRow(q, qEvs), cuadrante: q }
  })

  // By distance
  const porDistancia = Object.values(DISTANCIAS).map(d => {
    const dEvs = lanz.filter(e => e.distancia === d)
    return { ...buildStatsRow(d, dEvs), distancia: d }
  })

  // By attack zone
  const porZona = Object.values(ZONAS_ATAQUE).map(zona => {
    const zEvs = lanz.filter(e => e.zonaAtaque === zona)
    return { ...buildStatsRow(zona, zEvs), zona }
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

  return {
    portero,
    recibidos: lanz.length,
    goles,
    paradas,
    postes,
    fuera,
    alArco,
    efectividad: ef,
    valoracion,
    ratingLabel: ratingLabel(ef),
    porCuadrante,
    porDistancia,
    porZona,
    porTipoLanzamiento,
    porTipoAtaque,
    porSituacion,
  }
}

/**
 * Compute stats for all goalkeepers.
 */
export const computeAllGoalkeeperStats = (porteros, eventos) =>
  porteros
    .map(p => computeGoalkeeperStats(p, eventos))
    .filter(s => s.recibidos > 0)
    .sort((a, b) => b.valoracion - a.valoracion)
