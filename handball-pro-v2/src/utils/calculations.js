// ─── PURE CALCULATION FUNCTIONS ───────────────────────────────────────────────
// No side effects. No imports from React or services.

/**
 * Safe percentage: returns 0 if denominator is 0.
 */
export const pct = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0

/**
 * Round to N decimal places.
 */
export const round = (n, decimals = 1) =>
  Math.round(n * 10 ** decimals) / 10 ** decimals

/**
 * Effectiveness: paradas / (paradas + goles)
 */
export const efectividad = (paradas, goles) =>
  pct(paradas, paradas + goles)

/**
 * Rating color based on effectiveness threshold.
 */
export const ratingColor = (value, { danger = 40, warning = 60, good = 75 } = {}) => {
  if (value >= good)    return '#00ff87'
  if (value >= warning) return '#ffa502'
  if (value >= danger)  return '#ff6b35'
  return '#ff4757'
}

/**
 * Classify a value into a rating label.
 */
export const ratingLabel = (value) => {
  if (value >= 75) return 'Excelente'
  if (value >= 60) return 'Bueno'
  if (value >= 45) return 'Regular'
  return 'Bajo'
}

/**
 * Score for MVP algorithm. Weighted event value.
 */
export const eventScore = (evento) => {
  const base = {
    gol: 10,
    parada: 8,
    poste: 1,
    fuera: 0,
    golpe_franco: 2,
    campo: 3,
    exclusion: -5,
    pasos: -3,
    linea: -3,
    perdida: -4,
    timeout: 0,
  }
  let score = 0
  if (evento.resultado) score += base[evento.resultado] ?? 0
  if (evento.tipoEvento !== 'lanzamiento') score += base[evento.tipoEvento] ?? 0
  if (evento.tipoAtaque === 'contraataque' && evento.resultado === 'gol') score += 3
  if (evento.distancia === '9m' && evento.resultado === 'gol') score += 2
  if (evento.distancia === '7m' && evento.resultado === 'gol') score += 1
  return score
}

/**
 * Group an array of objects by a key and apply an aggregator function.
 */
export const groupBy = (arr, key, aggregator) => {
  const map = {}
  arr.forEach(item => {
    const k = item[key]
    if (k === undefined || k === null || k === '') return
    if (!map[k]) map[k] = []
    map[k].push(item)
  })
  if (!aggregator) return map
  return Object.entries(map).map(([k, items]) => ({ key: k, ...aggregator(items, k) }))
}

/**
 * Build a stats row from a group of events.
 * Used by all breakdown tables.
 */
export const buildStatsRow = (label, eventos) => {
  const lanzamientos = eventos.filter(e => e.tipoEvento === 'lanzamiento')
  const goles       = lanzamientos.filter(e => e.resultado === 'gol').length
  const paradas     = lanzamientos.filter(e => e.resultado === 'parada').length
  const postes      = lanzamientos.filter(e => e.resultado === 'poste').length
  const fuera       = lanzamientos.filter(e => e.resultado === 'fuera').length
  const alArco      = goles + paradas
  return {
    label,
    lanzamientos: lanzamientos.length,
    goles,
    paradas,
    postes,
    fuera,
    alArco,
    efectividad: efectividad(paradas, goles),
    eficacia: pct(goles, lanzamientos.length),
  }
}
