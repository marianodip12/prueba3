// ─── MVP ENGINE ───────────────────────────────────────────────────────────────
// Configurable weighted scoring algorithm for MVP selection.

const DEFAULT_WEIGHTS = {
  gol:           10,
  parada:         0,   // for field players; goalkeepers use separate calc
  asistencia:     5,
  golpe_franco:   2,
  campo:          3,
  exclusion:     -5,
  perdida:       -4,
  pasos:         -3,
  linea:         -3,
  contraataqueGol: 3,
  penal:          1,
  distancia9m:    2,
  eficaciaBonus:  0.2,  // per % point above 50%
  exclusionEnemiga: 2,
}

/**
 * Calculate MVP score for a player based on their computed stats.
 * @param {Object} stats    - Player stats from computePlayerStats()
 * @param {Object} weights  - Optional override of weight config
 * @returns {Object} { score, breakdown }
 */
export const calcMVPScore = (stats, weights = DEFAULT_WEIGHTS) => {
  const w = { ...DEFAULT_WEIGHTS, ...weights }
  const breakdown = {}

  breakdown.goles            = stats.goles * w.gol
  breakdown.golpesFrancos    = stats.golpesFrancos * w.golpe_franco
  breakdown.campoContrario   = stats.campoContrario * w.campo
  breakdown.exclusiones      = stats.exclusiones * w.exclusion
  breakdown.perdidas         = (stats.perdidas || 0) * w.perdida
  breakdown.pasos            = (stats.pasos || 0) * w.pasos

  // Contraataque bonus (from tipoAtaque breakdown)
  const contraRow = stats.porTipoAtaque?.find(r => r.tipo === 'contraataque')
  breakdown.contraataque = (contraRow?.goles || 0) * w.contraataqueGol

  // 9m bonus
  const d9Row = stats.porDistancia?.find(r => r.distancia === '9m')
  breakdown.distancia9m = (d9Row?.goles || 0) * w.distancia9m

  // 7m/penal bonus
  const penalRow = stats.porDistancia?.find(r => r.distancia === '7m')
  breakdown.penal = (penalRow?.goles || 0) * w.penal

  // Eficacy bonus (every % above 50 adds 0.2 pts)
  const efBonus = Math.max(0, stats.eficacia - 50) * w.eficaciaBonus
  breakdown.eficaciaBonus = Math.round(efBonus * 10) / 10

  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0) * 10) / 10

  return { score, breakdown }
}

/**
 * Compute MVP rankings for a list of player stats.
 * @param {Array} allStats   - Array from computeAllPlayerStats()
 * @param {Object} weights   - Optional weight overrides
 * @returns {Array} Sorted array with score, breakdown, rank
 */
export const computeMVPRanking = (allStats, weights = DEFAULT_WEIGHTS) => {
  return allStats
    .map(stats => {
      const { score, breakdown } = calcMVPScore(stats, weights)
      return { ...stats, mvpScore: score, mvpBreakdown: breakdown }
    })
    .sort((a, b) => b.mvpScore - a.mvpScore)
    .map((s, i) => ({ ...s, rank: i + 1 }))
}

/**
 * Generate automated analysis text for a player.
 */
export const generatePlayerAnalysis = (stats) => {
  const insights = []

  if (stats.eficacia >= 70) insights.push(`✅ Excelente eficacia goleadora: ${stats.eficacia}%`)
  if (stats.eficacia < 40 && stats.lanzamientos >= 3) insights.push(`⚠️ Baja eficacia: solo ${stats.eficacia}% de conversión`)
  if (stats.exclusiones >= 2) insights.push(`🔴 Alta conflictividad: ${stats.exclusiones} exclusiones`)

  // Best zone
  const bestZone = [...(stats.porZona || [])].filter(z => z.lanzamientos >= 2).sort((a, b) => b.eficacia - a.eficacia)[0]
  if (bestZone) insights.push(`🎯 Mejor zona de ataque: Zona ${bestZone.label} (${bestZone.eficacia}%)`)

  // Worst zone
  const worstZone = [...(stats.porZona || [])].filter(z => z.lanzamientos >= 2).sort((a, b) => a.eficacia - b.eficacia)[0]
  if (worstZone && worstZone !== bestZone) insights.push(`📌 Zona a mejorar: Zona ${worstZone.label} (${worstZone.eficacia}%)`)

  // Best technique
  const bestTech = [...(stats.porTipoLanzamiento || [])].filter(t => t.lanzamientos >= 2).sort((a, b) => b.eficacia - a.eficacia)[0]
  if (bestTech) insights.push(`💪 Técnica más efectiva: ${bestTech.label} (${bestTech.eficacia}%)`)

  return insights
}
