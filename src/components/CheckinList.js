import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CheckinList({ patientId }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('checkins').select('*, rutinas(titulo)').eq('paciente_id', patientId).order('created_at', { ascending:false }).limit(20)
      .then(({ data }) => { setCheckins(data||[]); setLoading(false) })
  }, [patientId])

  if (loading) return <p style={{color:'#888',fontSize:14}}>Cargando...</p>
  if (checkins.length === 0) return <p style={{color:'#888',fontSize:14}}>Aún no hay check-ins de este paciente.</p>

  function dolorColor(v) {
    if (v <= 2) return '#0F6E56'
    if (v <= 4) return '#7CB342'
    if (v <= 6) return '#F9A825'
    if (v <= 8) return '#E05252'
    return '#B71C1C'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {checkins.map(c => (
        <div key={c.id} style={{...s.card, ...(c.dolor>=7?{borderColor:'#F09595'}:{})}}>
          <div style={s.top}>
            <div style={s.title}>{c.rutinas?.titulo || 'Sesión'}</div>
            <div style={s.date}>{new Date(c.created_at).toLocaleDateString('es-CL')}</div>
          </div>
          <div style={s.metrics}>
            <div style={s.metric}>
              <span style={{...s.metVal, color:dolorColor(c.dolor)}}>{c.dolor}</span>
              <span style={s.metLabel}>Dolor /10</span>
            </div>
            <div style={s.metric}>
              <span style={{...s.metVal, color:'#185FA5'}}>{c.rpe}</span>
              <span style={s.metLabel}>RPE /10</span>
            </div>
          </div>
          {c.comentario && <div style={s.comment}>"{c.comentario}"</div>}
        </div>
      ))}
    </div>
  )
}

const s = {
  card: { background:'#f9f9f9', borderRadius:10, padding:'10px 14px', border:'1px solid #eee' },
  top: { display:'flex', justifyContent:'space-between', marginBottom:8 },
  title: { fontSize:13, fontWeight:500 },
  date: { fontSize:11, color:'#888' },
  metrics: { display:'flex', gap:10, marginBottom:6 },
  metric: { flex:1, background:'white', borderRadius:8, padding:'8px', textAlign:'center' },
  metVal: { fontSize:20, fontWeight:600, display:'block', lineHeight:1 },
  metLabel: { fontSize:10, color:'#888', display:'block', marginTop:3 },
  comment: { fontSize:12, color:'#666', fontStyle:'italic', borderLeft:'2px solid #ddd', paddingLeft:8, lineHeight:1.5 }
}
