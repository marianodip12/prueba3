import { buildStatsRow, pct, efectividad, eventScore } from '../utils/calculations.js'
import { soloLanzamientos, porJugador } from '../utils/filters.js'
import { ZONAS_ATAQUE, DISTANCIAS, SITUACIONES_NUMERICAS, TIPOS_ATAQUE, TIPOS_LANZAMIENTO, CUADRANTES_PORTERIA, TIPOS_EVENTO, RESULTADOS } from '../data/eventSchema.js'

export const computePlayerStats = (jugador, eventos) => {
  const evs  = porJugador(eventos, jugador.id)
  const lanz = soloLanzamientos(evs)
  const goles  = lanz.filter(e => e.resultado === RESULTADOS.GOL).length
  const paradas= lanz.filter(e => e.resultado === RESULTADOS.PARADA).length
  return {
    jugador, totalEventos: evs.length, lanzamientos: lanz.length, goles, paradas,
    postes:  lanz.filter(e => e.resultado === RESULTADOS.POSTE).length,
    fuera:   lanz.filter(e => e.resultado === RESULTADOS.FUERA).length,
    alArco:  goles + paradas,
    eficacia: pct(goles, lanz.length), efectividad: efectividad(paradas, goles),
    exclusiones:   evs.filter(e => e.tipoEvento === TIPOS_EVENTO.EXCLUSION).length,
    perdidas:      evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PERDIDA).length,
    pasos:         evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PASOS).length,
    golpesFrancos: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.GOLPE_FRANCO).length,
    campoContrario:lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.CAMPO || e.distancia === DISTANCIAS.CAMPO).length,
    score: evs.reduce((a, e) => a + eventScore(e), 0),
    porZona:             Object.values(ZONAS_ATAQUE).map(z => ({ ...buildStatsRow(z, lanz.filter(e => e.zonaAtaque === z)),          zona: z })),
    porCuadrante:        Object.values(CUADRANTES_PORTERIA).map(q => ({ ...buildStatsRow(q, lanz.filter(e => e.cuadrantePorteria === q)), cuadrante: q })),
    porTipoLanzamiento:  Object.values(TIPOS_LANZAMIENTO).map(t => ({ ...buildStatsRow(t, lanz.filter(e => e.tipoLanzamiento === t)),   tipo: t })),
    porTipoAtaque:       Object.values(TIPOS_ATAQUE).map(t => ({ ...buildStatsRow(t, lanz.filter(e => e.tipoAtaque === t)),             tipo: t })),
    porSituacion:        Object.values(SITUACIONES_NUMERICAS).map(s => ({ ...buildStatsRow(s, lanz.filter(e => e.situacionNumerica === s)), situacion: s })),
    porDistancia:        Object.values(DISTANCIAS).map(d => ({ ...buildStatsRow(d, lanz.filter(e => e.distancia === d)),                distancia: d })),
  }
}

export const computeAllPlayerStats = (jugadores, eventos) =>
  jugadores.map(j => computePlayerStats(j, eventos)).filter(s => s.totalEventos > 0).sort((a, b) => b.score - a.score)
