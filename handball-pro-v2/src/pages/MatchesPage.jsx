import { useState } from 'react'
import { useMatch } from '../context/MatchContext.jsx'
import { Card, Section, Btn, FormInput, Modal, EmptyState, T } from '../components/ui/index.jsx'

const emptyForm = () => ({
  rival: '', fecha: new Date().toISOString().split('T')[0],
  competicion: '', temporada: '', sede: 'local',
})

export const MatchesPage = ({ setTab }) => {
  const { matches, activeMatchId, selectMatch, createMatch, updateMatch, deleteMatch } = useMatch()
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(emptyForm())
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setShowForm(true) }
  const openEdit   = (m) => {
    setForm({ rival: m.rival, fecha: m.fecha, competicion: m.competicion || '', temporada: m.temporada || '', sede: m.sede || 'local' })
    setEditId(m.id); setShowForm(true)
  }

  const handleSave = () => {
    if (!form.rival.trim()) { alert('El nombre del rival es obligatorio'); return }
    if (editId) updateMatch(editId, form)
    else {
      const id = createMatch(form)
      selectMatch(id)
      setTab('register')
    }
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (!confirm('¿Eliminar este partido y todos sus datos?')) return
    deleteMatch(id)
  }

  const handleSelect = (m) => { selectMatch(m.id); setTab('register') }

  return (
    <div>
      <Section
        title="Gestión de Partidos"
        action={<Btn onClick={openCreate}>+ Nuevo Partido</Btn>}
      >
        {matches.length === 0 ? (
          <EmptyState icon="🤾" title="No hay partidos registrados"
            sub="Crea tu primer partido para comenzar a registrar estadísticas"
            action={<Btn onClick={openCreate}>+ Crear Partido</Btn>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 16 }}>
            {matches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                active={activeMatchId === m.id}
                onSelect={() => handleSelect(m)}
                onEdit={() => openEdit(m)}
                onDelete={() => handleDelete(m.id)}
              />
            ))}
          </div>
        )}
      </Section>

      {showForm && (
        <Modal title={editId ? 'Editar Partido' : 'Nuevo Partido'} onClose={() => setShowForm(false)}>
          <FormInput label="Rival" value={form.rival} onChange={v => set('rival', v)} required />
          <FormInput label="Fecha" type="date" value={form.fecha} onChange={v => set('fecha', v)} />
          <FormInput label="Competición" value={form.competicion} onChange={v => set('competicion', v)} />
          <FormInput label="Temporada" value={form.temporada} onChange={v => set('temporada', v)} />
          <FormInput label="Sede" value={form.sede} onChange={v => set('sede', v)}
            options={[{ value: 'local', label: 'Local' }, { value: 'visitante', label: 'Visitante' }]} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn onClick={handleSave}>💾 Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

const MatchCard = ({ match, active, onSelect, onEdit, onDelete }) => {
  const golesLocal     = match.eventos?.filter(e => e.equipo === 'local'     && e.resultado === 'gol').length || 0
  const golesVisitante = match.eventos?.filter(e => e.equipo === 'visitante' && e.resultado === 'gol').length || 0

  return (
    <Card
      onClick={onSelect}
      style={{ cursor: 'pointer', borderColor: active ? T.accent : T.border, transition: 'border-color .2s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: T.text }}>vs {match.rival || '—'}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
            {match.fecha}
            {match.competicion && ` · ${match.competicion}`}
          </div>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 'bold', color: T.accent, fontFamily: T.font }}>{golesLocal}</span>
            <span style={{ fontSize: 12, color: T.muted }}>—</span>
            <span style={{ fontSize: 22, fontWeight: 'bold', color: T.red, fontFamily: T.font }}>{golesVisitante}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: T.cyan }}>⚡ {match.eventos?.length || 0} eventos</span>
            <span style={{ fontSize: 11, color: T.muted }}>🧤 {match.porteros?.length || 0} porteros</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Btn small variant="secondary" onClick={e => { e.stopPropagation(); onEdit() }}>✏️</Btn>
          <Btn small variant="danger"    onClick={e => { e.stopPropagation(); onDelete() }}>🗑️</Btn>
        </div>
      </div>
      {active && (
        <div style={{ marginTop: 10, fontSize: 10, color: T.accent, letterSpacing: 2 }}>▸ PARTIDO ACTIVO</div>
      )}
    </Card>
  )
}
