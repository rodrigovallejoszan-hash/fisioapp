import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PatientList from '../components/PatientList'
import PatientDetail from '../components/PatientDetail'
import NewPatient from '../components/NewPatient'

export default function AdminDashboard() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('list')
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState(0)

  useEffect(() => { loadPatients() }, [])

  async function loadPatients() {
    setLoading(true)
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })
    setPatients(data || [])
    const urgent = (data || []).filter(p => {
      const fin = new Date(p.suscripcion_fin)
      return fin < new Date()
    })
    setAlerts(urgent.length)
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('fisioapp_admin')
    window.location.href = '/admin/login'
  }

  function selectPatient(p) {
    setSelected(p)
    setView('detail')
  }

  return (
    <div style={s.layout}>
      <div style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}>
            <div style={s.logoMark}>F</div>
            <span style={s.logoText}>FisioApp</span>
          </div>
          <nav style={s.nav}>
            <button style={{...s.navItem, ...(view==='list'||view==='detail'?s.navActive:{})}} onClick={()=>setView('list')}>
              <span style={s.navIcon}>👥</span> Pacientes
            </button>
            <button style={s.navItem} onClick={()=>setView('new')}>
              <span style={s.navIcon}>➕</span> Nuevo paciente
            </button>
          </nav>
        </div>
        <button style={s.logout} onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>
              {view==='list' && 'Mis pacientes'}
              {view==='detail' && selected?.nombre}
              {view==='new' && 'Nuevo paciente'}
            </h1>
            {alerts > 0 && <span style={s.alertBadge}>⚠️ {alerts} suscripción{alerts>1?'es':''} vencida{alerts>1?'s':''}</span>}
          </div>
          {view==='list' && (
            <button style={s.btnGreen} onClick={()=>setView('new')}>+ Nuevo paciente</button>
          )}
          {view==='detail' && (
            <button style={s.btnOutline} onClick={()=>setView('list')}>← Volver</button>
          )}
        </div>

        <div style={s.content}>
          {loading && <div style={s.loading}>Cargando pacientes...</div>}
          {!loading && view==='list' && (
            <PatientList patients={patients} onSelect={selectPatient} onRefresh={loadPatients} />
          )}
          {!loading && view==='detail' && selected && (
            <PatientDetail patient={selected} onRefresh={()=>{loadPatients();setView('list')}} />
          )}
          {view==='new' && (
            <NewPatient onSaved={()=>{loadPatients();setView('list')}} onCancel={()=>setView('list')} />
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  layout: { display:'flex', minHeight:'100vh', background:'#f5f5f5' },
  sidebar: { width:220, background:'#0a2a1f', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'1rem 0.75rem', flexShrink:0 },
  sideTop: {},
  logo: { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:24 },
  logoMark: { width:32, height:32, borderRadius:8, background:'#1D9E75', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 },
  logoText: { fontSize:16, fontWeight:600, color:'white' },
  nav: { display:'flex', flexDirection:'column', gap:4 },
  navItem: { display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.6)', fontSize:13, textAlign:'left', cursor:'pointer' },
  navActive: { background:'rgba(255,255,255,0.1)', color:'white' },
  navIcon: { fontSize:16 },
  logout: { background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', padding:'7px 12px', borderRadius:8, fontSize:12, cursor:'pointer' },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { background:'white', padding:'1rem 1.5rem', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between' },
  pageTitle: { fontSize:20, fontWeight:600, marginBottom:4 },
  alertBadge: { fontSize:12, background:'#fef2f2', color:'#dc2626', padding:'3px 10px', borderRadius:20 },
  content: { flex:1, padding:'1.5rem', overflowY:'auto' },
  loading: { textAlign:'center', padding:'3rem', color:'#666' },
  btnGreen: { background:'#0F6E56', color:'white', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:500 },
  btnOutline: { background:'transparent', color:'#0F6E56', border:'1px solid #0F6E56', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:500 }
}
