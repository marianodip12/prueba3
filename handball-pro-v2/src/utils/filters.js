// ─── EVENT FILTER UTILITIES ───────────────────────────────────────────────────

/**
 * Return only lanzamiento events.
 */
export const soloLanzamientos = (eventos) =>
  eventos.filter(e => e.tipoEvento === 'lanzamiento')

/**
 * Filter events belonging to a team.
 */
export const porEquipo = (eventos, equipo) =>
  eventos.filter(e => e.equipo === equipo)

/**
 * Filter events by jugador ID.
 */
export const porJugador = (eventos, jugadorId) =>
  eventos.filter(e => e.jugadorId === jugadorId)

/**
 * Filter events by portero (events directed at a specific goalkeeper).
 * Portero is stored separately as porteroId in lanzamiento events.
 */
export const porPortero = (eventos, porteroId) =>
  eventos.filter(e => e.porteroId === porteroId)

/**
 * Filter by a specific field value.
 */
export const porCampo = (eventos, campo, valor) =>
  eventos.filter(e => e[campo] === valor)

/**
 * Filter lanzamientos that went on target (gol or parada).
 */
export const alArco = (eventos) =>
  soloLanzamientos(eventos).filter(e => e.resultado === 'gol' || e.resultado === 'parada')

/**
 * Filter by minuto range.
 */
export const porRangoMinuto = (eventos, min, max) =>
  eventos.filter(e => e.minuto >= min && e.minuto <= max)

/**
 * Build timeline buckets of N minutes.
 */
export const buildTimeline = (eventos, bucketSize = 5) => {
  const buckets = {}
  eventos
    .filter(e => e.minuto !== '' && e.minuto !== null && e.minuto !== undefined)
    .forEach(e => {
      const b = Math.floor(Number(e.minuto) / bucketSize) * bucketSize
      if (!buckets[b]) buckets[b] = []
      buckets[b].push(e)
    })
  return Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([min, evs]) => ({ min: Number(min), eventos: evs }))
}
