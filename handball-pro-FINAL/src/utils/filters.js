export const soloLanzamientos = evs => evs.filter(e => e.tipoEvento === 'lanzamiento')
export const porEquipo        = (evs, eq) => evs.filter(e => e.equipo === eq)
export const porJugador       = (evs, id) => evs.filter(e => e.jugadorId === id)
export const porPortero       = (evs, id) => evs.filter(e => e.porteroId === id)

export const buildTimeline = (evs, size = 5) => {
  const b = {}
  evs.filter(e => e.minuto !== '' && e.minuto != null).forEach(e => {
    const k = Math.floor(Number(e.minuto) / size) * size
    if (!b[k]) b[k] = []
    b[k].push(e)
  })
  return Object.entries(b).sort(([a],[b]) => Number(a)-Number(b)).map(([min, eventos]) => ({ min: Number(min), eventos }))
}
