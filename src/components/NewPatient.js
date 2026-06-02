import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewPatient({ onSaved, onCancel }) {
  const [form, setForm] = useState({ nombre:'', email:'', telefono:'', diagnostico:'', suscripcion_inicio:'', suscripcion_fin:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6)
    const { error: err } = await supabase.from('pacientes').insert({
      nombre: form.nombre.trim(),
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      diagnostico: form.diagnostico.trim() || null,
      suscripcion_inicio: form.suscripcion_inicio || null,
      suscripcion_fin: form.suscripcion_fin || null,
      link_token: token
    })
    setSaving(false)
    if (err) { setError('Error al guardar: ' + err.message); return }
    onSaved()
  }

  return (
    <div style={s.wrap}>
      <form onSubmit={handleSave} style={s.form}>
        <h2 style={s.title}>Datos del paciente</h2>
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Nombre completo *</label>
            <input style={s.input} value={form.nombre} onChange={e=>set('nombre',e.target.value)} placeholder="Ej: María Álvarez" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Diagnóstico</label>
            <input style={s.input} value={form.diagnostico} onChange={e=>set('diagnostico',e.target.value)} placeholder="Ej: Lumbalgia crónica" />
          </div>
        </div>
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Teléfono / WhatsApp</label>
            <input style={s.input} value={form.telefono} onChange={e=>set('telefono',e.target.value)} placeholder="+56 9 1234 5678" />
          </div>
        </div>
        <h2 style={{...s.title, marginTop:24}}>Suscripción</h2>
        <div style={s.row}>
          <div style={s.field}>
            <label style={s.label}>Fecha de inicio</label>
            <input style={s.input} type="date" value={form.suscripcion_inicio} onChange={e=>set('suscripcion_inicio',e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Fecha de vencimiento</label>
            <input style={s.input} type="date" value={form.suscripcion_fin} onChange={e=>set('suscripcion_fin',e.target.value)} />
          </div>
        </div>
        {error && <p style={s.error}>{error}</p>}
        <div style={s.btnRow}>
          <button type="button" style={s.btnCancel} onClick={onCancel}>Cancelar</button>
          <button type="submit" style={s.btnSave} disabled={saving}>{saving ? 'Guardando...' : 'Crear paciente'}</button>
        </div>
      </form>
    </div>
  )
}

const s = {
  wrap: { maxWidth:700 },
  form: { background:'white', borderRadius:12, padding:'1.5rem', border:'1px solid #eee' },
  title: { fontSize:16, fontWeight:600, marginBottom:16, color:'#0F6E56' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:12, fontWeight:500, color:'#555' },
  input: { padding:'9px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:14, outline:'none' },
  error: { color:'#dc2626', fontSize:13, marginBottom:12 },
  btnRow: { display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 },
  btnCancel: { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'white', fontSize:13, color:'#666' },
  btnSave: { padding:'8px 20px', borderRadius:8, border:'none', background:'#0F6E56', color:'white', fontSize:13, fontWeight:500 }
}
