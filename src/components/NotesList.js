import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = ['observacion','evaluacion','alerta','objetivo']
const TIPO_LABEL = { observacion:'Observación', evaluacion:'Evaluación', alerta:'Alerta', objetivo:'Objetivo' }
const TIPO_COLOR = { observacion:['#E1F5EE','#085041'], evaluacion:['#E6F1FB','#0C447C'], alerta:['#FCEBEB','#7F0000'], objetivo:['#FAEEDA','#633806'] }

export default function NotesList({ patientId }) {
  const [notes, setNotes] = useState([])
  const [tipo, setTipo] = useState('observacion')
  const [contenido, setContenido] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadNotes() }, [patientId])

  async function loadNotes() {
    const { data } = await supabase.from('notas_clinicas').select('*').eq('paciente_id', patientId).order('created_at', { ascending:false })
    setNotes(data||[])
  }

  async function saveNote() {
    if (!contenido.trim()) return
    setSaving(true)
    await supabase.from('notas_clinicas').insert({ paciente_id:patientId, tipo, contenido:contenido.trim() })
    setContenido('')
    await loadNotes()
    setSaving(false)
  }

  return (
    <div>
      <div style={s.notes}>
        {notes.length === 0 && <p style={{color:'#888',fontSize:14,marginBottom:16}}>Aún no hay notas clínicas.</p>}
        {notes.map(n => {
          const [bg, tc] = TIPO_COLOR[n.tipo]||['#f5f5f5','#333']
          return (
            <div key={n.id} style={s.card}>
              <div style={s.cardTop}>
                <span style={{...s.tag, background:bg, color:tc}}>{TIPO_LABEL[n.tipo]||n.tipo}</span>
                <span style={s.date}>{new Date(n.created_at).toLocaleDateString('es-CL')}</span>
              </div>
              <p style={s.text}>{n.contenido}</p>
            </div>
          )
        })}
      </div>
      <div style={s.newNote}>
        <div style={s.newTitle}>Nueva nota</div>
        <select style={s.select} value={tipo} onChange={e=>setTipo(e.target.value)}>
          {TIPOS.map(t=><option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
        <textarea style={s.textarea} value={contenido} onChange={e=>setContenido(e.target.value)} placeholder="Escribe tu observación clínica..." />
        <button style={s.btn} onClick={saveNote} disabled={saving||!contenido.trim()}>{saving?'Guardando...':'Guardar nota'}</button>
      </div>
    </div>
  )
}

const s = {
  notes: { marginBottom:20 },
  card: { background:'#f9f9f9', borderRadius:10, padding:'10px 14px', marginBottom:8, border:'1px solid #eee' },
  cardTop: { display:'flex', alignItems:'center', gap:8, marginBottom:6 },
  tag: { fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:500 },
  date: { fontSize:11, color:'#888' },
  text: { fontSize:13, lineHeight:1.55, color:'#333' },
  newNote: { background:'#f9f9f9', borderRadius:10, padding:'12px 14px', border:'1px solid #eee' },
  newTitle: { fontSize:13, fontWeight:500, marginBottom:10 },
  select: { width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid #ddd', fontSize:13, marginBottom:8, background:'white', outline:'none' },
  textarea: { width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:13, minHeight:80, resize:'vertical', fontFamily:'inherit', marginBottom:8, outline:'none' },
  btn: { background:'#0F6E56', color:'white', border:'none', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:500 }
}
