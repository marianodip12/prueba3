import { computeTeamStats }          from './teamStats.js'
import { computeAllPlayerStats }     from './playerStats.js'
import { computeAllGoalkeeperStats } from './goalkeeperStats.js'
import { computeMVPRanking }         from './mvpEngine.js'
import { porEquipo }                 from '../utils/filters.js'

export const computeMatchStats = (match) => {
  if (!match?.eventos) return null
  const { eventos, jugadoresLocales=[], jugadoresVisitantes=[], porteros=[] } = match
  const tL = computeTeamStats(eventos, 'local')
  const tV = computeTeamStats(eventos, 'visitante')
  const pL = computeAllPlayerStats(jugadoresLocales,    porEquipo(eventos, 'local'))
  const pV = computeAllPlayerStats(jugadoresVisitantes, porEquipo(eventos, 'visitante'))
  const gk = computeAllGoalkeeperStats(porteros, eventos)
  return {
    match, teamLocal: tL, teamVisitante: tV,
    playersLocal: pL, playersVisitante: pV, goalkeeperStats: gk,
    mvpLocal: computeMVPRanking(pL), mvpVisitante: computeMVPRanking(pV),
    meta: { totalEventos: eventos.length, golesLocal: tL.goles, golesVisitante: tV.goles },
  }
}
