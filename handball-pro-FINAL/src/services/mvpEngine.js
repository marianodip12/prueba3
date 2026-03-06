const W = { gol: 10, golpe_franco: 2, campo: 3, exclusion: -5, perdida: -4, pasos: -3, contraataqueGol: 3, penal: 1, distancia9m: 2, eficaciaBonus: 0.2 }

export const calcMVPScore = (stats) => {
  const b = {}
  b.goles          = stats.goles * W.gol
  b.golpesFrancos  = stats.golpesFrancos * W.golpe_franco
  b.campoContrario = stats.campoContrario * W.campo
  b.exclusiones    = stats.exclusiones * W.exclusion
  b.perdidas       = (stats.perdidas || 0) * W.perdida
  b.pasos          = (stats.pasos || 0) * W.pasos
  b.contraataque   = (stats.porTipoAtaque?.find(r => r.tipo === 'contraataque')?.goles || 0) * W.contraataqueGol
  b.distancia9m    = (stats.porDistancia?.find(r => r.distancia === '9m')?.goles || 0) * W.distancia9m
  b.penal          = (stats.porDistancia?.find(r => r.distancia === '7m')?.goles || 0) * W.penal
  b.eficaciaBonus  = Math.round(Math.max(0, stats.eficacia - 50) * W.eficaciaBonus * 10) / 10
  return { score: Math.round(Object.values(b).reduce((a, v) => a + v, 0) * 10) / 10, breakdown: b }
}

export const computeMVPRanking = (allStats) =>
  allStats.map(s => { const { score, breakdown } = calcMVPScore(s); return { ...s, mvpScore: score, mvpBreakdown: breakdown } })
    .sort((a, b) => b.mvpScore - a.mvpScore).map((s, i) => ({ ...s, rank: i + 1 }))

export const generatePlayerAnalysis = (stats) => {
  const ins = []
  if (stats.eficacia >= 70) ins.push(`✅ Excelente eficacia goleadora: ${stats.eficacia}%`)
  if (stats.eficacia < 40 && stats.lanzamientos >= 3) ins.push(`⚠️ Baja eficacia: solo ${stats.eficacia}% de conversión`)
  if (stats.exclusiones >= 2) ins.push(`🔴 Alta conflictividad: ${stats.exclusiones} exclusiones`)
  const bZ = [...(stats.porZona||[])].filter(z=>z.lanzamientos>=2).sort((a,b)=>b.eficacia-a.eficacia)[0]
  if (bZ) ins.push(`🎯 Mejor zona: Zona ${bZ.label} (${bZ.eficacia}%)`)
  const wZ = [...(stats.porZona||[])].filter(z=>z.lanzamientos>=2).sort((a,b)=>a.eficacia-b.eficacia)[0]
  if (wZ && wZ !== bZ) ins.push(`📌 Zona a mejorar: Zona ${wZ.label} (${wZ.eficacia}%)`)
  const bT = [...(stats.porTipoLanzamiento||[])].filter(t=>t.lanzamientos>=2).sort((a,b)=>b.eficacia-a.eficacia)[0]
  if (bT) ins.push(`💪 Técnica más efectiva: ${bT.label} (${bT.eficacia}%)`)
  return ins
}
