import { buildStatsRow, pct, efectividad } from '../utils/calculations.js'
import { soloLanzamientos, porEquipo, buildTimeline } from '../utils/filters.js'
import { ZONAS_ATAQUE, DISTANCIAS, SITUACIONES_NUMERICAS, TIPOS_ATAQUE, TIPOS_EVENTO, RESULTADOS } from '../data/eventSchema.js'

export const computeTeamStats = (eventos, equipo) => {
  const evs  = porEquipo(eventos, equipo)
  const lanz = soloLanzamientos(evs)
  const goles  = lanz.filter(e => e.resultado === RESULTADOS.GOL).length
  const paradas= lanz.filter(e => e.resultado === RESULTADOS.PARADA).length
  const postes = lanz.filter(e => e.resultado === RESULTADOS.POSTE).length
  const fuera  = lanz.filter(e => e.resultado === RESULTADOS.FUERA).length
  const cta    = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.CONTRAATAQUE)
  const pos    = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.POSICIONAL)
  const campo  = lanz.filter(e => e.tipoAtaque === TIPOS_ATAQUE.CAMPO || e.distancia === DISTANCIAS.CAMPO)
  const timeline = buildTimeline(evs, 5).map(b => {
    const bl = soloLanzamientos(b.eventos)
    const bg = bl.filter(e => e.resultado === RESULTADOS.GOL).length
    const bp = bl.filter(e => e.resultado === RESULTADOS.PARADA).length
    return { min: b.min, goles: bg, lanzamientos: bl.length, eficacia: pct(bg, bl.length), efectividad: efectividad(bp, bg) }
  })
  return {
    equipo, lanzamientos: lanz.length, goles, paradas, postes, fuera, alArco: goles + paradas,
    eficacia: pct(goles, lanz.length), efectividad: efectividad(paradas, goles),
    exclusiones: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.EXCLUSION).length,
    perdidas:    evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PERDIDA).length,
    pasos:       evs.filter(e => e.tipoEvento === TIPOS_EVENTO.PASOS).length,
    lineas:      evs.filter(e => e.tipoEvento === TIPOS_EVENTO.LINEA).length,
    timeouts:    evs.filter(e => e.tipoEvento === TIPOS_EVENTO.TIMEOUT).length,
    golpesFrancos: evs.filter(e => e.tipoEvento === TIPOS_EVENTO.GOLPE_FRANCO).length,
    contraataque:  { total: cta.length, goles: cta.filter(e=>e.resultado===RESULTADOS.GOL).length, eficacia: pct(cta.filter(e=>e.resultado===RESULTADOS.GOL).length, cta.length) },
    posicional:    { total: pos.length, goles: pos.filter(e=>e.resultado===RESULTADOS.GOL).length, eficacia: pct(pos.filter(e=>e.resultado===RESULTADOS.GOL).length, pos.length) },
    campoContrario:{ total: campo.length, goles: campo.filter(e=>e.resultado===RESULTADOS.GOL).length, eficacia: pct(campo.filter(e=>e.resultado===RESULTADOS.GOL).length, campo.length) },
    porZona:       Object.values(ZONAS_ATAQUE).map(z => buildStatsRow(z, lanz.filter(e => e.zonaAtaque === z))),
    porDistancia:  Object.values(DISTANCIAS).map(d => buildStatsRow(d, lanz.filter(e => e.distancia === d))),
    porSituacion:  Object.values(SITUACIONES_NUMERICAS).map(s => buildStatsRow(s, lanz.filter(e => e.situacionNumerica === s))),
    timeline,
  }
}
