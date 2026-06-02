import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PatientView() {
  const { token } = useParams()
  const [patient, setPatient] = useState(null)
  const [todayRoutines, setTodayRoutines] = useState([])
  const [calendarData, setCalendarData] = useState([])
  const [tab, setTab] = useState('hoy')
  const [selectedEx, setSelectedEx] = useState(null)
  const [checkinDone, setCheckinDone] = useState(false)
  const [dolor, setDolor] = useState(0)
  const [rpe, setRpe] = useState(5)
  const [comentario, setComentario] = useState('')
  const [timerSec, setTimerSec] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const timerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [expired, setExpired] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadData() }, [token])

  async function loadData() {
    const { data: p } = await supabase.from('pacientes').select('*').eq('link_token', token).single()
    if (!p) { setLoading(false); return }
    setPatient(p)
    if (p.suscripcion_fin && new Date(p.suscripcion_fin) < new Date()) { setExpired(true); setLoading(false); return }
    const { data: cal } = await supabase.from('calendario').select('*, rutinas(*, secciones(*, ejercicios(*)))').eq('paciente_id', p.id).order('fecha')
    setCalendarData(cal||[])
    const todayEntries = (cal||[]).filter(c => c.fecha === today)
    const routines = todayEntries.map(e => e.rutinas).filter(Boolean)
    for (const r of routines) {
      if (r.secciones) r.secciones.sort((a,b)=>a.orden-b.orden)
      if (r.secciones) r.secciones.forEach(s => s.ejercicios && s.ejercicios.sort((a,b)=>a.orden-b.orden))
    }
    setTodayRoutines(routines)
    setLoading(false)
  }

  function openEx(ex) {
    setSelectedEx(ex)
    const secs = parseTime(ex.repeticiones)
    if (secs) { setTimerSec(secs); setTimerRunning(false); setTimerDone(false) }
    else { setTimerSec(0) }
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function parseTime(rep) {
    if (!rep) return 0
    const m = rep.match(/(\d+)\s*(seg|s\b|min|m\b)/i)
    if (!m) return 0
    return /min|m/i.test(m[2]) ? parseInt(m[1])*60 : parseInt(m[1])
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    let remaining = timerSec
    setTimerRunning(true)
    timerRef.current = setInterval(() => {
      remaining--
      setTimerSec(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setTimerRunning(false)
        setTimerDone(true)
      }
    }, 1000)
  }

  function pauseTimer() { clearInterval(timerRef.current); setTimerRunning(false) }
  function resetTimer() {
    clearInterval(timerRef.current)
    setTimerRunning(false); setTimerDone(false)
    if (selectedEx) setTimerSec(parseTime(selectedEx.repeticiones))
  }

  function fmtTime(s) {
    const m = Math.floor(s/60).toString().padStart(2,'0')
    return m+':'+(s%60).toString().padStart(2,'0')
  }

  async function sendCheckin() {
    if (!patient || todayRoutines.length === 0) return
    await supabase.from('checkins').insert({ paciente_id:patient.id, rutina_id:todayRoutines[0].id, dolor, rpe, comentario:comentario||null })
    setCheckinDone(true)
  }

  function getYtEmbed(url) {
    if (!url) return null
    let m = url.match(/shorts\/([a-zA-Z0-9_-]+)/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&loop=1&playlist=${m[1]}&rel=0`
    m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&loop=1&playlist=${m[1]}&rel=0`
    return null
  }

  if (loading) return <div style={s.center}><p>Cargando...</p></div>
  if (!patient) return <div style={s.center}><p style={s.notFound}>Link no válido.<br/>Contacta a tu fisioterapeuta.</p></div>
  if (expired) return (
    <div style={s.center}>
      <div style={s.expiredCard}>
        <div style={s.lockIcon}>🔒</div>
        <h2 style={s.expTitle}>Suscripción vencida</h2>
        <p style={s.expText}>Tu acceso ha vencido. Contacta a tu fisioterapeuta para renovar.</p>
        {patient.telefono && (
          <a href={`https://wa.me/${patient.telefono.replace(/\D/g,'')}`} style={s.waBtn}>Contactar por WhatsApp</a>
        )}
      </div>
    </div>
  )

  const uniqueDates = [...new Set(calendarData.map(c=>c.fecha))].sort()
  const futureDates = uniqueDates.filter(d => d >= today)

  return (
    <div style={s.page}>
      <div style={s.phone}>
        <div style={s.appHeader}>
          <div style={s.greeting}>Hola, {patient.nombre.split(' ')[0]}</div>
          <div style={s.appName}>FisioApp</div>
        </div>

        <div style={s.tabs}>
          {[['hoy','Hoy'],['semana','Semana'],['checkin','Check-in'],['historial','Historial']].map(([id,label]) => (
            <button key={id} style={{...s.tabBtn, ...(tab===id?s.tabActive:{})}} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        <div style={s.body}>
          {tab==='hoy' && (
            <div>
              {todayRoutines.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>🗓</div>
                  <p style={s.emptyText}>No tienes rutinas programadas para hoy.</p>
                </div>
              ) : todayRoutines.map(r => (
                <div key={r.id}>
                  <div style={s.routineHeader}>
                    <div style={s.routineTitle}>{r.titulo}</div>
                    <div style={s.routineMeta}>Hoy · {r.secciones?.reduce((a,s)=>a+s.ejercicios?.length,0)||0} ejercicios</div>
                  </div>
                  {r.secciones?.map(sec => (
                    <div key={sec.id}>
                      <div style={s.secLabel}>{sec.nombre}</div>
                      {sec.ejercicios?.map(ex => {
                        const isTimed = parseTime(ex.repeticiones) > 0
                        return (
                          <div key={ex.id} style={s.exCard} onClick={()=>openEx(ex)}>
                            <div style={s.exInfo}>
                              <div style={s.exName}>{ex.nombre}</div>
                              <div style={s.exPills}>
                                {ex.series && <span style={s.pill}>{ex.series} series</span>}
                                {ex.repeticiones && <span style={{...s.pill, ...(isTimed?s.pillBlue:{})}}>{ex.repeticiones}</span>}
                                {ex.youtube_url && <span style={{...s.pill, ...s.pillAmber}}>Video</span>}
                                {isTimed && <span style={{...s.pill, ...s.pillBlue}}>⏱ Timer</span>}
                              </div>
                            </div>
                            <span style={s.chevron}>›</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ))}
              {todayRoutines.length > 0 && (
                <button style={s.doneBtn} onClick={()=>setTab('checkin')}>✓ Completé mi rutina</button>
              )}
            </div>
          )}

          {tab==='semana' && (
            <div>
              <div style={s.calLabel}>Tu programa</div>
              {futureDates.length === 0 ? <p style={{color:'#888',fontSize:14}}>No hay rutinas programadas próximamente.</p> : (
                futureDates.map(date => {
                  const entries = calendarData.filter(c=>c.fecha===date)
                  const isToday = date === today
                  return (
                    <div key={date} style={s.calRow} onClick={()=>{if(isToday)setTab('hoy')}}>
                      <div style={{...s.calDate, ...(isToday?s.calDateToday:{})}}>
                        <div style={s.calDayNum}>{new Date(date+'T12:00:00').getDate()}</div>
                        <div style={s.calDayName}>{new Date(date+'T12:00:00').toLocaleDateString('es-CL',{weekday:'short'})}</div>
                      </div>
                      <div style={s.calEntries}>
                        {entries.map(e=><div key={e.id} style={s.calPill}>{e.rutinas?.titulo}</div>)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab==='checkin' && (
            checkinDone ? (
              <div style={s.successBox}>
                <div style={s.successIcon}>✅</div>
                <div style={s.successTitle}>¡Feedback enviado!</div>
                <p style={s.successText}>Tu fisioterapeuta revisará tu reporte.</p>
              </div>
            ) : (
              <div>
                <div style={s.ciTitle}>¿Cómo te fue hoy?</div>
                <div style={s.ciBox}>
                  <div style={s.ciLabel}>Dolor (0 = sin dolor · 10 = máximo)</div>
                  <div style={s.painRow}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
                      <button key={v} style={{...s.painBtn, background:painColors[v], color:v>=7?'white':v>=3?'#333':'#1B5E20', border: dolor===v?'2px solid #111':'2px solid transparent', transform:dolor===v?'scale(1.15)':'scale(1)'}} onClick={()=>setDolor(v)}>{v}</button>
                    ))}
                  </div>
                </div>
                <div style={s.ciBox}>
                  <div style={s.ciLabel}>Percepción del esfuerzo (RPE)</div>
                  <div style={s.rpeRow}>
                    {[[2,'Liviano','#E8F5E9','#1B5E20'],[4,'Moderado','#C8E6C9','#2E7D32'],[6,'Intenso','#FFF9C4','#F57F17'],[8,'Muy duro','#FFE0B2','#E65100'],[10,'Máximo','#FFCCBC','#BF360C']].map(([v,l,bg,tc]) => (
                      <button key={v} style={{...s.rpeBtn, background:bg, color:tc, border:rpe===v?`2px solid ${tc}`:'2px solid transparent'}} onClick={()=>setRpe(v)}>
                        <div style={{fontSize:16,fontWeight:600}}>{v}</div>
                        <div style={{fontSize:10}}>{l}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.ciBox}>
                  <div style={s.ciLabel}>Comentario (opcional)</div>
                  <textarea style={s.ciTextarea} value={comentario} onChange={e=>setComentario(e.target.value)} placeholder="Ej: sentí molestia en la rodilla derecha..." />
                </div>
                <button style={s.sendBtn} onClick={sendCheckin}>Enviar feedback</button>
              </div>
            )
          )}

          {tab==='historial' && <HistorialTab patientId={patient.id} />}
        </div>
      </div>

      {selectedEx && (
        <div style={s.modalBg} onClick={e=>{ if(e.target===e.currentTarget){clearInterval(timerRef.current);setSelectedEx(null)}}}>
          <div style={s.modal}>
            <div style={s.modalVid}>
              {getYtEmbed(selectedEx.youtube_url) ? (
                <iframe src={getYtEmbed(selectedEx.youtube_url)} style={{width:'100%',height:'100%',border:'none'}} allow="autoplay; encrypted-media" allowFullScreen title={selectedEx.nombre} />
              ) : (
                <div style={s.noVid}><span style={{fontSize:36}}>▶</span><span style={{fontSize:12,color:'rgba(255,255,255,.6)',marginTop:8}}>Sin video asignado</span></div>
              )}
            </div>
            <div style={s.modalBody}>
              <div style={s.modalTitle}>{selectedEx.nombre}</div>
              <div style={s.modalStats}>
                {selectedEx.series && <div style={s.mstat}><span style={s.mstatVal}>{selectedEx.series}</span><span style={s.mstatLabel}>Series</span></div>}
                {selectedEx.repeticiones && timerSec === 0 && <div style={s.mstat}><span style={s.mstatVal}>{selectedEx.repeticiones}</span><span style={s.mstatLabel}>Reps</span></div>}
              </div>
              {timerSec > 0 && (
                <div style={s.timerBox}>
                  <div style={{...s.timerNum, color:timerDone?'#185FA5':timerRunning?'#0F6E56':'#1a1a1a'}}>{timerDone?'¡Lista!':fmtTime(timerSec)}</div>
                  <div style={s.timerSub}>{timerDone?'Serie completada':timerRunning?'Ejecutando...':'Presiona iniciar cuando estés listo'}</div>
                  {!timerDone && (
                    <button style={s.timerBtn} onClick={timerRunning?pauseTimer:startTimer}>
                      {timerRunning?'⏸ Pausar':'▶ Iniciar'}
                    </button>
                  )}
                  <button style={s.timerReset} onClick={resetTimer}>Reiniciar</button>
                </div>
              )}
              {selectedEx.notas && <div style={s.modalNote}>ℹ {selectedEx.notas}</div>}
              <button style={s.modalClose} onClick={()=>{clearInterval(timerRef.current);setSelectedEx(null)}}>← Volver a la rutina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const painColors = ['#4CAF50','#8BC34A','#CDDC39','#FFF176','#FFC107','#FF9800','#FF7043','#F44336','#E53935','#B71C1C','#7B1FA2']

function HistorialTab({ patientId }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    supabase.from('checkins').select('*, rutinas(titulo)').eq('paciente_id', patientId).order('created_at',{ascending:false}).limit(10)
      .then(({data}) => setItems(data||[]))
  }, [patientId])
  if (items.length===0) return <p style={{color:'#888',fontSize:14,padding:'1rem 0'}}>Aún no hay historial.</p>
  const dc = v => v<=2?'#0F6E56':v<=5?'#F9A825':v<=7?'#E05252':'#B71C1C'
  return (
    <div>
      {items.map(c=>(
        <div key={c.id} style={hs.card}>
          <div style={hs.top}><span style={hs.title}>{c.rutinas?.titulo||'Sesión'}</span><span style={hs.date}>{new Date(c.created_at).toLocaleDateString('es-CL')}</span></div>
          <div style={hs.row}>
            <div style={hs.m}><span style={{...hs.v,color:dc(c.dolor)}}>{c.dolor}</span><span style={hs.l}>Dolor /10</span></div>
            <div style={hs.m}><span style={{...hs.v,color:'#185FA5'}}>{c.rpe}</span><span style={hs.l}>RPE /10</span></div>
          </div>
          {c.comentario && <div style={hs.comment}>"{c.comentario}"
