export const pct        = (n, d)      => d > 0 ? Math.round((n / d) * 100) : 0
export const efectividad= (par, gol)  => pct(par, par + gol)
export const ratingLabel= v => v >= 75 ? 'Excelente' : v >= 60 ? 'Bueno' : v >= 45 ? 'Regular' : 'Bajo'
export const ratingColor= v => v >= 75 ? '#00ff87' : v >= 60 ? '#ffa502' : v >= 45 ? '#ff6b35' : '#ff4757'

export const eventScore = (e) => {
  const base = { gol: 10, parada: 0, poste: 1, fuera: 0, golpe_franco: 2, campo: 3, exclusion: -5, pasos: -3, linea: -3, perdida: -4, timeout: 0 }
  let s = 0
  if (e.resultado)                s += base[e.resultado] ?? 0
  if (e.tipoEvento !== 'lanzamiento') s += base[e.tipoEvento] ?? 0
  if (e.tipoAtaque === 'contraataque' && e.resultado === 'gol') s += 3
  if (e.distancia  === '9m'           && e.resultado === 'gol') s += 2
  if (e.distancia  === '7m'           && e.resultado === 'gol') s += 1
  return s
}

export const buildStatsRow = (label, eventos) => {
  const lanz  = eventos.filter(e => e.tipoEvento === 'lanzamiento')
  const goles = lanz.filter(e => e.resultado === 'gol').length
  const par   = lanz.filter(e => e.resultado === 'parada').length
  const post  = lanz.filter(e => e.resultado === 'poste').length
  const fuera = lanz.filter(e => e.resultado === 'fuera').length
  return { label, lanzamientos: lanz.length, goles, paradas: par, postes: post, fuera, alArco: goles + par, eficacia: pct(goles, lanz.length), efectividad: efectividad(par, goles) }
}
