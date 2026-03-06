import { buildStatsRow, pct, efectividad, ratingLabel } from '../utils/calculations.js'
import { soloLanzamientos, porPortero } from '../utils/filters.js'
import { CUADRANTES_PORTERIA, DISTANCIAS, ZONAS_ATAQUE, TIPOS_LANZAMIENTO, TIPOS_ATAQUE, SITUACIONES_NUMERICAS, RESULTADOS } from '../data/eventSchema.js'

export const computeGoalkeeperStats = (portero, eventos) => {
  const evs  = porPortero(eventos, portero.id)
  const lanz = soloLanzamientos(evs)
  const goles  = lanz.filter(e => e.resultado === RESULTADOS.GOL).length
  const paradas= lanz.filter(e => e.resultado === RESULTADOS.PARADA).length
  const ef     = efectividad(paradas, goles)
  const hard   = lanz.filter(e => e.distancia === DISTANCIAS.NUEVE || e.tipoAtaque === TIPOS_ATAQUE.CONTRAATAQUE)
  const hardPar= hard.filter(e => e.resultado === RESULTADOS.PARADA).length
  const hardEf = efectividad(hardPar, hard.filter(e => e.resultado === RESULTADOS.GOL).length)
  const valoracion = Math.round(ef * 0.5 + hardEf * 0.3 + Math.min(lanz.length * 2, 20))
  return {
    portero, recibidos: lanz.length, goles, paradas,
    postes: lanz.filter(e => e.resultado === RESULTADOS.POSTE).length,
    fuera:  lanz.filter(e => e.resultado === RESULTADOS.FUERA).length,
    alArco: goles + paradas, efectividad: ef, valoracion, ratingLabel: ratingLabel(ef),
    porCuadrante:       Object.values(CUADRANTES_PORTERIA).map(q => ({ ...buildStatsRow(q, lanz.filter(e => e.cuadrantePorteria === q)), cuadrante: q })),
    porDistancia:       Object.values(DISTANCIAS).map(d => ({ ...buildStatsRow(d, lanz.filter(e => e.distancia === d)),                distancia: d })),
    porZona:            Object.values(ZONAS_ATAQUE).map(z => ({ ...buildStatsRow(z, lanz.filter(e => e.zonaAtaque === z)),             zona: z })),
    porTipoLanzamiento: Object.values(TIPOS_LANZAMIENTO).map(t => ({ ...buildStatsRow(t, lanz.filter(e => e.tipoLanzamiento === t)),   tipo: t })),
    porTipoAtaque:      Object.values(TIPOS_ATAQUE).map(t => ({ ...buildStatsRow(t, lanz.filter(e => e.tipoAtaque === t)),             tipo: t })),
    porSituacion:       Object.values(SITUACIONES_NUMERICAS).map(s => ({ ...buildStatsRow(s, lanz.filter(e => e.situacionNumerica === s)), situacion: s })),
  }
}

export const computeAllGoalkeeperStats = (porteros, eventos) =>
  porteros.map(p => computeGoalkeeperStats(p, eventos)).filter(s => s.recibidos > 0).sort((a, b) => b.valoracion - a.valoracion)
