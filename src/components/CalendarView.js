import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CalendarView({ patientId, routines, onRefresh }) {
  const [assignments, setAssignments] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRoutine, setSelectedRoutine] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const monthName = today.toLocaleDateString('es-CL', { month:'long', year:'numeric' })

  useEffect(() => { loadAssignments() }, [patientId])

  async function loadAssignments() {
    const start = `${year}-${String(month+1).padStart(2,'0')}-01`
    const end = `${year}-${String(month+1).padStart(2,'0')}-${daysInMonth}`
    const { data } = await supabase.from('calendario').select('*, rutinas(titulo)').eq('paciente_id', patientId).gte('fecha', start).lte('fecha', end)
    setAssignments(data || [])
  }

  function getAssignmentsForDay(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return assignments.filter(a => a.fecha === dateStr)
  }

  async function assignRoutine() {
    if (!selectedDate || !selectedRoutine) return
    setSaving(true)
    await supabase.from('calendario').upsert({ paciente_id:patientId, rutina_id:selectedRoutine, fecha:selectedDate })
    await loadAssignments()
    setSaving(false)
    setSelectedRoutine('')
  }

  async function removeAssignment(id) {
    await supabase.from('calendario').delete().eq('id', id)
    loadAssignments()
  }

  const days = []
  for (let i=0; i<firstDay; i++) days.push(null)
  for (let i=1; i<=daysInMonth; i++) days.push(i)

  const colors = ['#0F6E56','#534AB7','#854F0B','#185FA5','#A32D2D']

  return (
    <div>
      <div style={s.monthLabel}>{monthName.charAt(0).toUpperCase()+monthName.slice(1)}</div>
      <div style={s.weekHeaders}>
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><div key={d} style={s.wh}>{d}</div>)}
      </div>
      <div style={s.grid}>
        {days.map((day,i) => {
          if (!day) return <div key={`e${i}`} />
          const dayAssignments = getAssignmentsForDay(day)
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isToday = day === today.getDate()
          const isSelected = selectedDate === dateStr
          return (
            <div key={day} style={{...s.cell, ...(isToday?s.cellToday:{}), ...(isSelected?s.cellSelected:{})}} onClick={() => setSelectedDate(dateStr)}>
              <div style={{...s.dayNum, ...(isToday?{color:'#0F6E56',fontWeight:600}:{})}}>{day}</div>
              {dayAssignments.map((a,ai) => (
                <div key={a.id} style={{...s.pill, background:colors[ai%colors.length]}}>
                  {a.rutinas?.titulo?.split('—')[0]?.trim().slice(0,10)}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div style={s.assignPanel}>
          <div style={s.assignTitle}>
            {new Date(selectedDate+'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' })}
          </div>
          {getAssignmentsForDay(parseInt(selectedDate.split('-')[2])).map(a => (
            <div key={a.id} style={s.assignedRow}>
              <span style={s.assignedName}>{a.rutinas?.titulo}</span>
              <button style={s.btnRemove} onClick={() => removeAssignment(a.id)}>Quitar</button>
            </div>
          ))}
          <div style={s.addRow}>
            <select style={s.select} value={selectedRoutine} onChange={e=>setSelectedRoutine(e.target.value)}>
              <option value="">— Selecciona rutina —</option>
              {routines.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
            </select>
            <button style={s.btnAssign} onClick={assignRoutine} disabled={saving||!selectedRoutine}>
              {saving?'...':'Asignar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  monthLabel: { fontSize:15, fontWeight:600, marginBottom:10, color:'#0F6E56' },
  weekHeaders: { display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 },
  wh: { fontSize:11, fontWeight:500, color:'#888', textAlign:'center', padding:'4px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:16 },
  cell: { minHeight:52, background:'#f9f9f9', borderRadius:8, padding:'4px 5px', cursor:'pointer', border:'1px solid transparent' },
  cellToday: { border:'1.5px solid #0F6E56' },
  cellSelected: { border:'1.5px solid #0F6E56', background:'#f0faf5' },
  dayNum: { fontSize:11, color:'#888', marginBottom:3 },
  pill: { fontSize:9, color:'white', borderRadius:3, padding:'1px 4px', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  assignPanel: { background:'#f0faf5', borderRadius:10, padding:'12px 14px', border:'1px solid #9FE1CB' },
  assignTitle: { fontSize:13, fontWeight:500, color:'#0F6E56', marginBottom:10, textTransform:'capitalize' },
  assignedRow: { display:'flex', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:7, padding:'7px 10px', marginBottom:6 },
  assignedName: { fontSize:13, fontWeight:500 },
  btnRemove: { background:'transparent', border:'1px solid #ddd', color:'#888', padding:'3px 10px', borderRadius:6, fontSize:11 },
  addRow: { display:'flex', gap:8, marginTop:8 },
  select: { flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid #ddd', fontSize:13, outline:'none', background:'white' },
  btnAssign: { background:'#0F6E56', color:'white', border:'none', padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500 }
}
