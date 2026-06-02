import React, { useState } from 'react'

const ADMIN_PASSWORD = 'fisio2026'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('fisioapp_admin', 'true')
      window.location.href = '/admin'
    } else {
      setError('Contraseña incorrecta')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoMark}>F</div>
          <span style={s.logoText}>FisioApp</span>
        </div>
        <h1 style={s.title}>Panel administrador</h1>
        <p style={s.sub}>Acceso solo para el fisioterapeuta</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={s.input}
            autoFocus
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.btn}>Ingresar</button>
        </form>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0faf5' },
  card: { background:'white', borderRadius:16, padding:'2rem', width:'100%', maxWidth:380, boxShadow:'0 2px 20px rgba(0,0,0,0.08)' },
  logo: { display:'flex', alignItems:'center', gap:10, marginBottom:'1.5rem' },
  logoMark: { width:40, height:40, borderRadius:10, background:'#0F6E56', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:600 },
  logoText: { fontSize:20, fontWeight:600, color:'#0F6E56' },
  title: { fontSize:22, fontWeight:600, marginBottom:6 },
  sub: { fontSize:14, color:'#666', marginBottom:'1.5rem' },
  input: { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #ddd', fontSize:15, marginBottom:12, outline:'none' },
  error: { color:'#dc2626', fontSize:13, marginBottom:10 },
  btn: { width:'100%', padding:'11px', background:'#0F6E56', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:500 }
}
