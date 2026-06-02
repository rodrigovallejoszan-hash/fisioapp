import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import RoutineBuilder from './RoutineBuilder'
import CalendarView from './CalendarView'
import CheckinList from './CheckinList'
import NotesList from './NotesList'

export default function PatientDetail({ patient, onRefresh }) {
  const [tab, setTab] = useState('calendar')
  const [routines, setRoutines] = useState([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [copied, setCopied] = useState(false)
  const origin = window.location.origin
  const patientLink = `${origin}/p/${patient.link_token}`

  useEffect(() => { loadRoutines() }, [patient.id])

  async function loadRoutines() {
    const { data } = await supabase
      .from('rutinas')
      .select('*, secciones(*, ejercicios(*))')
      .eq('paciente_id', patient.id)
      .order('created_at', { ascending: false })
    setRoutines(data || [])
  }

  function copyLink() {
    navigator.clipboard.writeText(patientLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id:'calendar', label:'Calendario' },
    { id:'routines', label:'Rutinas' },
    { id:'checkins', label:'Feedback' },
    { id:'notes', label:'Notas clínicas' },
  ]

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.headerInfo}>
          <p style={s.diag}>{patient.diagnostico || 'Sin diagnóstico'}</p>
          {patient.suscripcion_fin && (
            <p style={s.sub}>Suscripción hasta {new Date(patient.suscripcion_fin).toLocaleDateString('es-CL')}</p>
          )}
        </div>
        <div style={s.headerActions}>
          <div style={s.linkBox}>
            <span style={s.linkText}>{patientLink}</span>
            <button style={s.copyBtn} onClick={copyLink}>{copied ? '✓ Copiado' : 'Copiar link'}</button>
          </div>
          <button style={s.btnGreen} onClick={() => setShowBuilder(true)}>+ Nueva rutina</button>
        </div>
      </div>

      {showBuilder && (
        <RoutineBuilder
          patientId={patient.id}
          onSaved={() => { loadRoutines(); setShowBuilder(false) }}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      <div style={s.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={{...s.tab, ...(tab===t.id?s.tabActive:{})}} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.tabContent}>
        {tab === 'calendar' && <CalendarView patientId={patient.id} routines={routines} onRefresh={loadRoutines} />}
        {tab === 'routines' && (
          <div style={s.routineList}>
            {routines.length === 0 && <p style={s.empty}>No hay rutinas aún. Crea la primera con el botón de arriba.</p>}
            {routines.map(r => (
              <div key={r.id} style={s.rCard}>
                <div>
                  <div style={s.rName}>{r.titulo}</div>
                  <div style={s.rMeta}>{r.secciones?.reduce((a,s)=>a+s.ejercicios?.length,0)||0} ejercicios · {r.secciones?.length||0} secciones</div>
                </div>
                <button style={s.btnDup} onClick={async()=>{
                  const newR = { paciente_id:patient.id, titulo:r.titulo+' (copia)', descripcion:r.descripcion }
                  const { data:nr } = await supabase.from('rutinas').insert(newR).select().single()
                  if(nr && r.secciones) {
                    for(const sec of r.secciones) {
                      const { data:ns } = await supabase.from('secciones').insert({ rutina_id:nr.id, nombre:sec.nombre, tipo:sec.tipo, orden:sec.orden }).select().single()
                      if(ns && sec.ejercicios) {
                        for(const ex of sec.ejercicios) {
                          await supabase.from('ejercicios').insert({ seccion_id:ns.id, nombre:ex.nombre, youtube_url:ex.youtube_url, series:ex.series, repeticiones:ex.repeticiones, notas:ex.notas, orden:ex.orden })
                        }
                      }
                    }
                  }
                  loadRoutines()
                }}>Duplicar</button>
              </div>
            ))}
          </div>
        )}
        {tab === 'checkins' && <CheckinList patientId={patient.id} />}
        {tab === 'notes' && <NotesList patientId={patient.id} />}
      </div>
    </div>
  )
}

const s = {
  wrap: { maxWidth:900 },
  header: { background:'white', borderRadius:12, padding:'1rem 1.25rem', marginBottom:16, border:'1px solid #eee', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 },
  headerInfo: {},
  diag: { fontSize:14, color:'#555', marginBottom:4 },
  sub: { fontSize:12, color:'#888' },
  headerActions: { display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' },
  linkBox: { display:'flex', alignItems:'center', gap:8, background:'#f0faf5', borderRadius:8, padding:'6px 10px' },
  linkText: { fontSize:11, color:'#0F6E56', fontFamily:'monospace', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  copyBtn: { background:'#0F6E56', color:'white', border:'none', padding:'4px 12px', borderRadius:6, fontSize:12, fontWeight:500, whiteSpace:'nowrap' },
  btnGreen: { background:'#0F6E56', color:'white', border:'none', padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500 },
  tabs: { display:'flex', gap:4, marginBottom:16, background:'white', borderRadius:10, padding:4, border:'1px solid #eee', width:'fit-content' },
  tab: { padding:'6px 16px', borderRadius:7, border:'none', background:'transparent', fontSize:13, color:'#666', cursor:'pointer' },
  tabActive: { background:'#0F6E56', color:'white', fontWeight:500 },
  tabContent: { background:'white', borderRadius:12, padding:'1.25rem', border:'1px solid #eee' },
  routineList: { display:'flex', flexDirection:'column', gap:8 },
  rCard: { display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f9f9f9', borderRadius:8, padding:'10px 14px' },
  rName: { fontSize:14, fontWeight:500 },
  rMeta: { fontSize:12, color:'#888', marginTop:2 },
  btnDup: { background:'transparent', border:'1px solid #0F6E56', color:'#0F6E56', padding:'5px 12px', borderRadius:6, fontSize:12 },
  empty: { color:'#888', fontSize:14, padding:'1rem 0' }
}
