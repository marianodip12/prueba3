export const EQUIPOS            = { LOCAL: 'local', VISITANTE: 'visitante' }
export const TIPOS_EVENTO       = { LANZAMIENTO: 'lanzamiento', PERDIDA: 'perdida', PASOS: 'pasos', LINEA: 'linea', EXCLUSION: 'exclusion', TIMEOUT: 'timeout', GOLPE_FRANCO: 'golpe_franco' }
export const RESULTADOS         = { GOL: 'gol', PARADA: 'parada', POSTE: 'poste', FUERA: 'fuera' }
export const DISTANCIAS         = { SEIS: '6m', NUEVE: '9m', SIETE: '7m', CAMPO: 'campo' }
export const ZONAS_ATAQUE       = { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F' }
export const CUADRANTES_PORTERIA= { SUP_IZQ: 'sup_izq', SUP_DER: 'sup_der', INF_IZQ: 'inf_izq', INF_DER: 'inf_der', CENTRO: 'centro' }
export const TIPOS_LANZAMIENTO  = { PENETRACION: 'penetracion', FINTA: 'finta', HABILIDAD: 'habilidad', SALTO: 'salto', APOYO: 'apoyo' }
export const TIPOS_ATAQUE       = { CONTRAATAQUE: 'contraataque', POSICIONAL: 'posicional', CAMPO: 'campo' }
export const SITUACIONES_NUMERICAS = { IGUALDAD: 'igualdad', SUPERIORIDAD: 'superioridad', INFERIORIDAD: 'inferioridad' }

export const LABELS = {
  equipo:            { local: 'Local', visitante: 'Visitante' },
  tipoEvento:        { lanzamiento: 'Lanzamiento', perdida: 'Pérdida', pasos: 'Pasos/Dobles', linea: 'Pisar Línea', exclusion: 'Exclusión', timeout: 'Time Out', golpe_franco: 'Golpe Franco' },
  resultado:         { gol: 'Gol', parada: 'Parada', poste: 'Poste', fuera: 'Fuera' },
  distancia:         { '6m': '6 Metros', '9m': '9 Metros', '7m': 'Penal (7m)', campo: 'Campo Contrario' },
  zonaAtaque:        { A: 'Extremo Izq.', B: 'Lateral Izq.', C: 'Central Izq.', D: 'Central Der.', E: 'Lateral Der.', F: 'Extremo Der.' },
  cuadrantePorteria: { sup_izq: '↖ Sup. Izq.', sup_der: '↗ Sup. Der.', inf_izq: '↙ Inf. Izq.', inf_der: '↘ Inf. Der.', centro: '• Centro' },
  tipoLanzamiento:   { penetracion: 'Penetración', finta: 'Finta', habilidad: 'Habilidad', salto: 'Salto', apoyo: 'Apoyo' },
  tipoAtaque:        { contraataque: 'Contraataque', posicional: 'Posicional', campo: 'Campo Contrario' },
  situacionNumerica: { igualdad: 'Igualdad', superioridad: 'Superioridad', inferioridad: 'Inferioridad' },
}

export const emptyEvent = () => ({
  id: null, equipo: '', jugadorId: '', tipoEvento: '', resultado: null,
  distancia: '', zonaAtaque: '', cuadrantePorteria: '', tipoLanzamiento: '',
  tipoAtaque: '', situacionNumerica: '', minuto: '',
})

export const emptyMatch = () => ({
  id: null, fecha: new Date().toISOString().split('T')[0], rival: '',
  competicion: '', temporada: '', sede: 'local',
  jugadoresLocales: [], jugadoresVisitantes: [], porteros: [], eventos: [],
})
