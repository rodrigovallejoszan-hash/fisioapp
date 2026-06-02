import React from 'react'

export default function PatientList({ patients, onSelect }) {
  if (patients.length === 0) {
    return (
      <div style={s.empty}>
        <div style={s.emptyIcon}>👥</div>
        <p style={s.emptyText}>Aún no tienes pacientes.<br/>Crea el primero con el botón de arriba.</p>
      </div>
    )
  }

  return (
    <div style={s.grid}>
      {patients.map(p => {
        const fin = p.suscripcion_fin ? new Date(p.suscripcion_fin) : null
        const hoy = new Date()
        const diasRestantes = fin ? Math.ceil((fin - hoy) / (1000*60*60*24)) : null
        let status = 'active'
        if (!fin) status = 'nodate'
        else if (diasRestantes < 0) status = 'expired'
        else if (diasRestantes <= 7) status = 'soon'

        const statusLabel = { active:'Activo', expired:'Vencido', soon:'Vence pronto', nodate:'Sin fecha' }
        const statusColor = { active:'#E1F5EE', expired:'#FCEBEB', soon:'#FAEEDA', nodate:'#f5f5f5' }
        const statusText = { active:'#085041', expired:'#7F0000', soon:'#633806', nodate:'#666' }
        const initials = p.nombre.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
        const avatarBg = { active:'#E1F5EE', expired:'#FCEBEB', soon:'#FAEEDA', nodate:'#eee' }
        const avatarText = { active:'#0F6E56', expired:'#A32D2D', soon:'#854F0B', nodate:'#666' }

        return (
          <div key={p.id} style={s.card} onClick={() => onSelect(p)}>
            <div style={s.cardLeft}>
              <div style={{...s.avatar, background:avatarBg[status], color:avatarText[status]}}>{initials}</div>
              <div>
                <div style={s.name}>{p.nombre}</div>
                <div style={s.meta}>{p.diagnostico || 'Sin diagnóstico'}</div>
                {fin && <div style={s.fecha}>
                  {diasRestantes < 0 ? `Venció hace ${Math.abs(diasRestantes)} días` :
                   diasRestantes === 0 ? 'Vence hoy' :
                   `Vence en ${diasRestantes} días`}
                </div>}
              </div>
            </div>
            <div style={s.cardRight}>
              <span style={{...s.badge, background:statusColor[status], color:statusText[status]}}>
                {statusLabel[status]}
              </span>
              <span style={s.arrow}>›</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  grid: { display:'flex', flexDirection:'column', gap:10, maxWidth:700 },
  card: { background:'white', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border:'1px solid #eee' },
  cardLeft: { display:'flex', alignItems:'center', gap:12 },
  avatar: { width:42, height:42, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:600, flexShrink:0 },
  name: { fontSize:15, fontWeight:500, marginBottom:2 },
  meta: { fontSize:12, color:'#888' },
  fecha: { fontSize:11, color:'#666', marginTop:2 },
  cardRight: { display:'flex', alignItems:'center', gap:10 },
  badge: { fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500 },
  arrow: { fontSize:20, color:'#0F6E56', fontWeight:300 },
  empty: { textAlign:'center', padding:'4rem 2rem' },
  emptyIcon: { fontSize:48, marginBottom:12 },
  emptyText: { fontSize:15, color:'#888', lineHeight:1.6 }
}
