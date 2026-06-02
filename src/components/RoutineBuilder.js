import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = ['Calentamiento','Movilidad','Fortalecimiento','Cardio','Empuje','Tracción','Vuelta a la calma','Otro']

export default function RoutineBuilder({ patientId, onSaved, onCancel }) {
  const [titulo, setTitulo] = useState('')
  const [secciones, setSecciones] = useState([{ tipo:'Calentamiento', ejercicios:[{nombre:'',youtube_url:'',series:'',repeticiones:'',notas:''}] }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addSeccion() {
    setSecciones(s => [...s, { tipo:'Fortalecimiento', ejercicios:[{nombre:'',youtube_url:'',series:'',repeticiones:'',notas:''}] }])
  }
  function removeSeccion(i) { setSecciones(s => s.filter((_,idx)=>idx!==i)) }
  function updateSeccion(i, k, v) { setSecciones(s => s.map((sec,idx)=>idx===i?{...sec,[k]:v}:sec)) }
  function addEjercicio(si) { setSecciones(s => s.map((sec,idx)=>idx===si?{...sec,ejercicios:[...sec.ejercicios,{nombre:'',youtube_url:'',series:'',repeticiones:'',notas:''}]}:sec)) }
  function removeEjercicio(si,ei) { setSecciones(s => s.map((sec,idx)=>idx===si?{...sec,ejercicios:sec.ejercicios.filter((_,eidx)=>eidx!==ei)}:sec)) }
  function updateEjercicio(si,ei,k,v) { setSecciones(s => s.map((sec,sidx)=>sidx===si?{...sec,ejercicios:sec.ejercicios.map((ex,eidx)=>eidx===ei?{...ex,[k]:v}:ex)}:sec)) }

  async function handleSave() {
    if (!titulo.trim()) { setError('El título es obligatorio'); return }
    setSaving(true)
    const { data: rutina, error: e1 } = await supabase.from('rutinas').insert({ paciente_id:patientId, titulo:titulo.trim() }).select().single()
    if (e1) { setError(e1.message); setSaving(false); return }
    for (let si=0; si<secciones.length; si++) {
      const sec = secciones[si]
      const { data: secData } = await supabase.from('secciones').insert({ rutina_id:rutina.id, nombre:sec.tipo, tipo:sec.tipo.toLowerCase().replace(/ /g,'_'), orden:si }).select().single()
      if (secData) {
        for (let ei=0; ei<sec.ejercicios.length; ei++) {
          const ex = sec.ejercicios[ei]
          if (!ex.nombre.trim()) continue
          await supabase.from('ejercicios').insert({ seccion_id:secData.id, nombre:ex.nombre.trim(), youtube_url:ex.youtube_url.trim()||null, series:ex.series.trim()||null, repeticiones:ex.repeticiones.trim()||null, notas:ex.notas.trim()||null, orden:ei })
        }
      }
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2 style={s.title}>Nueva rutina</h2>
        <div style={s.headerBtns}>
          <button style={s.btnCancel} onClick={onCancel}>Cancelar</button>
          <button style={s.btnSave} onClick={handleSave} disabled={saving}>{saving?'Guardando...':'Guardar rutina'}</button>
        </div>
      </div>
      <div style={s.field}>
        <label style={s.label}>Título de la rutina</label>
        <input style={s.input} value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Movilidad — Semana 1" />
      </div>
      {error && <p style={s.error}>{error}</p>}
      {secciones.map((sec,si) => (
        <div key={si} style={s.secBlock}>
          <div style={s.secHeader}>
            <select style={s.select} value={sec.tipo} onChange={e=>updateSeccion(si,'tipo',e.target.value)}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
            <button style={s.btnRemove} onClick={()=>removeSeccion(si)}>Eliminar sección</button>
          </div>
          {sec.ejercicios.map((ex,ei) => (
            <div key={ei} style={s.exBlock}>
              <div style={s.exHeader}>
                <span style={s.exLabel}>Ejercicio {ei+1}</span>
                <button style={s.btnRemove} onClick={()=>removeEjercicio(si,ei)}>Quitar</button>
              </div>
              <div style={s.exGrid}>
                <div style={{gridColumn:'span 2'}}>
                  <label style={s.label}>Nombre del ejercicio</label>
                  <input style={s.input} value={ex.nombre} onChange={e=>updateEjercicio(si,ei,'nombre',e.target.value)} placeholder="Ej: Sentadilla en pared" />
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={s.label}>Link YouTube (Shorts o normal)</label>
                  <input style={s.input} value={ex.youtube_url} onChange={e=>updateEjercicio(si,ei,'youtube_url',e.target.value)} placeholder="https://youtube.com/shorts/..." />
                </div>
                <div>
                  <label style={s.label}>Series</label>
                  <input style={s.input} value={ex.series} onChange={e=>updateEjercicio(si,ei,'series',e.target.value)} placeholder="Ej: 3" />
                </div>
                <div>
                  <label style={s.label}>Reps / Tiempo</label>
                  <input style={s.input} value={ex.repeticiones} onChange={e=>updateEjercicio(si,ei,'repeticiones',e.target.value)} placeholder="Ej: 12 reps / 30 seg" />
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={s.label}>Notas de ejecución</label>
                  <textarea style={s.textarea} value={ex.notas} onChange={e=>updateEjercicio(si,ei,'notas',e.target.value)} placeholder="Ej: Rodilla alineada con el pie..." />
                </div>
              </div>
            </div>
          ))}
          <button style={s.btnAddEx} onClick={()=>addEjercicio(si)}>+ Agregar ejercicio</button>
        </div>
      ))}
      <button style={s.btnAddSec} onClick={addSeccion}>+ Agregar sección</button>
    </div>
  )
}

const s = {
  wrap: { background:'white', borderRadius:12, padding:'1.25rem', marginBottom:16, border:'1px solid #eee' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  title: { fontSize:16, fontWeight:600, color:'#0F6E56' },
  headerBtns: { display:'flex', gap:8 },
  field: { marginBottom:14 },
  label: { fontSize:12, fontWeight:500, color:'#555', display:'block', marginBottom:5 },
  input: { width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:13, outline:'none' },
  select: { padding:'7px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:13, outline:'none', background:'white' },
  textarea: { width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', fontSize:13, outline:'none', minHeight:60, resize:'vertical', fontFamily:'inherit' },
  error: { color:'#dc2626', fontSize:13, marginBottom:12 },
  secBlock: { background:'#f9f9f9', borderRadius:10, padding:'12px 14px', marginBottom:12 },
  secHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  exBlock: { background:'white', borderRadius:8, padding:'10px 12px', marginBottom:8, border:'1px solid #eee' },
  exHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  exLabel: { fontSize:12, fontWeight:500, color:'#888' },
  exGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px' },
  btnRemove: { background:'transparent', border:'1px solid #ddd', color:'#888', padding:'3px 10px', borderRadius:6, fontSize:11 },
  btnAddEx: { background:'transparent', border:'1px dashed #0F6E56', color:'#0F6E56', padding:'6px 14px', borderRadius:8, fontSize:12, width:'100%', marginTop:4 },
  btnAddSec: { background:'transparent', border:'1px dashed #0F6E56', color:'#0F6E56', padding:'8px 14px', borderRadius:8, fontSize:13, width:'100%', marginTop:4 },
  btnCancel: { padding:'7px 14px', borderRadius:8, border:'1px solid #ddd', background:'white', fontSize:13, color:'#666' },
  btnSave: { padding:'7px 16px', borderRadius:8, border:'none', background:'#0F6E56', color:'white', fontSize:13, fontWeight:500 }
}
