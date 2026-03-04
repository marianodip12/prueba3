// ─── STATS ENGINE — MAIN ORCHESTRATOR ────────────────────────────────────────
// Central entry point. Aggregates all stat modules into one result object.

import { computeTeamStats }           from './teamStats.js'
import { computeAllPlayerStats }      from './playerStats.js'
import { computeAllGoalkeeperStats }  from './goalkeeperStats.js'
import { computeMVPRanking }          from './mvpEngine.js'
import { porEquipo }                  from '../utils/filters.js'

/**
 * Run the full statistics computation for a match.
 * Call this once and memoize the result.
 *
 * @param {Object} match - Complete match object with eventos, jugadoresLocales,
 *                         jugadoresVisitantes, porteros.
 * @returns {Object} Full stats tree.
 */
export const computeMatchStats = (match) => {
  if (!match || !match.eventos) return null

  const { eventos, jugadoresLocales = [], jugadoresVisitantes = [], porteros = [] } = match

  const teamLocal      = computeTeamStats(eventos, 'local')
  const teamVisitante  = computeTeamStats(eventos, 'visitante')

  const localEvs      = porEquipo(eventos, 'local')
  const visitanteEvs  = porEquipo(eventos, 'visitante')

  const playersLocal       = computeAllPlayerStats(jugadoresLocales, localEvs)
  const playersVisitante   = computeAllPlayerStats(jugadoresVisitantes, visitanteEvs)
  const goalkeeperStats    = computeAllGoalkeeperStats(porteros, eventos)

  const mvpLocal       = computeMVPRanking(playersLocal)
  const mvpVisitante   = computeMVPRanking(playersVisitante)

  return {
    match,
    teamLocal,
    teamVisitante,
    playersLocal,
    playersVisitante,
    goalkeeperStats,
    mvpLocal,
    mvpVisitante,
    meta: {
      totalEventos: eventos.length,
      golesLocal:      teamLocal.goles,
      golesVisitante:  teamVisitante.goles,
      computedAt: Date.now(),
    },
  }
}
