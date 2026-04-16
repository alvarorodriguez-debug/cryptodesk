import { useState, useEffect, useCallback } from 'react'
import { storage, DEFAULT_CUENTAS, initials, genRef } from './utils'
import { generarInvoice } from './invoice'

// ─── Styles ────────────────────────────────────────────────────────────────
const S = {
  app: { display:'flex', flexDirection:'column', minHeight:'100vh' },
  topbar: { background:'var(--bg2)', borderBottom:'0.5px solid var(--border)', padding:'0 20px', display:'flex', alignItems:'center', gap:'8px', height:'52px', position:'sticky', top:0, zIndex:100 },
  brand: { fontSize:'15px', fontWeight:'600', marginRight:'12px', letterSpacing:'-0.3px' },
  brandAccent: { color:'var(--green)' },
  main: { flex:1, padding:'24px 20px', maxWidth:'860px', width:'100%', margin:'0 auto' },
  card: { background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border)', padding:'20px', marginBottom:'14px' },
  cardTitle: { fontSize:'14px', fontWeight:'500', marginBottom:'16px', color:'var(--text)' },
  formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' },
  formRowFull: { display:'grid', gridTemplateColumns:'1fr', gap:'12px', marginBottom:'12px' },
  formRowThree: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'12px' },
  label: { display:'block', fontSize:'11px', color:'var(--text2)', marginBottom:'4px', fontWeight:'500', letterSpacing:'0.3px' },
  btnBase: { padding:'8px 16px', borderRadius:'var(--radius)', border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:'13px' },
  btnPrimary: { padding:'8px 16px', borderRadius:'var(--radius)', border:'none', background:'var(--green)', color:'#0a1a12', fontSize:'13px', fontWeight:'500' },
  btnDanger: { padding:'8px 16px', borderRadius:'var(--radius)', border:'none', background:'var(--red-dim)', color:'var(--red)', fontSize:'13px', border:'0.5px solid rgba(255,90,90,0.3)' },
  btnSm: { padding:'5px 10px', fontSize:'12px' },
  metricGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' },
  metric: { background:'var(--bg3)', borderRadius:'var(--radius)', padding:'14px', border:'0.5px solid var(--border)' },
  metricLabel: { fontSize:'11px', color:'var(--text2)', marginBottom:'6px', fontWeight:'500' },
  metricVal: { fontSize:'22px', fontWeight:'600', letterSpacing:'-0.5px' },
  opRow: { display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', borderRadius:'var(--radius)', border:'0.5px solid var(--border)', marginBottom:'6px', cursor:'pointer', transition:'background .12s' },
  infoBox: { background:'var(--bg3)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:'10px' },
  tag: (estado) => {
    const map = { activa:['var(--amber-dim)','var(--amber)'], concretada:['var(--green-dim)','var(--green)'], cancelada:['var(--red-dim)','var(--red)'], pendiente:['var(--amber-dim)','var(--amber)'] }
    const [bg,color] = map[estado] || ['var(--bg3)','var(--text2)']
    return { display:'inline-block', padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'500', background:bg, color }
  },
  typeBadge: (t) => {
    const map = { compra:['var(--blue-dim)','var(--blue)'], venta:['var(--amber-dim)','var(--amber)'], transferencia:['var(--purple-dim)','var(--purple)'] }
    const [bg,color] = map[t] || ['var(--bg3)','var(--text2)']
    return { display:'inline-block', padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'500', background:bg, color }
  },
  avatar: (color='green') => ({
    width:36, height:36, borderRadius:'50%',
    background: color==='green' ? 'var(--green-dim)' : 'var(--blue-dim)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:'600', fontSize:'12px',
    color: color==='green' ? 'var(--green)' : 'var(--blue)',
    flexShrink:0
  }),
  divider: { border:'none', borderTop:'0.5px solid var(--border)', margin:'14px 0' },
  empty: { textAlign:'center', padding:'40px 20px', color:'var(--text3)', fontSize:'13px' },
  stepBar: { display:'flex', gap:'6px', marginBottom:'20px' },
  step: (active, done) => ({
    flex:1, padding:'7px 10px', borderRadius:'var(--radius)', fontSize:'12px', textAlign:'center',
    border: active ? '0.5px solid var(--green)' : '0.5px solid var(--border)',
    background: active ? 'var(--green-dim)' : done ? 'var(--bg3)' : 'transparent',
    color: active ? 'var(--green)' : done ? 'var(--text2)' : 'var(--text3)',
    fontWeight: active ? '500' : '400'
  }),
  calcBox: { background:'var(--bg3)', borderRadius:'var(--radius)', padding:'14px', marginTop:'12px', border:'0.5px solid var(--border)' },
  calcRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', fontSize:'13px', color:'var(--text2)' },
  calcRowTotal: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0 4px', fontSize:'14px', fontWeight:'500', borderTop:'0.5px solid var(--border2)', marginTop:'6px', color:'var(--text)' },
  accountBox: { background:'var(--green-dim)', border:'0.5px solid var(--green-border)', borderRadius:'var(--radius)', padding:'14px', margin:'12px 0' },
  filterBar: { display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' },
  filterChip: (active) => ({ padding:'5px 12px', borderRadius:'20px', border:'0.5px solid ' + (active ? 'var(--border2)' : 'var(--border)'), background: active ? 'var(--bg3)' : 'transparent', cursor:'pointer', fontSize:'12px', color: active ? 'var(--text)' : 'var(--text3)' }),
  modalBg: { position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  modal: { background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border2)', padding:'24px', width:'100%', maxWidth:'480px', maxHeight:'90vh', overflowY:'auto' },
  sectionHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' },
  h2: { fontSize:'18px', fontWeight:'600', letterSpacing:'-0.3px' },
  copyBtn: { display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'var(--radius)', border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', fontSize:'12px', cursor:'pointer' },
  monoText: { fontFamily:'var(--font-mono,monospace)', fontSize:'11px', wordBreak:'break-all', lineHeight:1.6 }
}

// ─── Small helpers ──────────────────────────────────────────────────────────
function Btn({ children, onClick, style, variant='base', sm, disabled }) {
  const base = variant === 'primary' ? S.btnPrimary : variant === 'danger' ? S.btnDanger : S.btnBase
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...(sm ? S.btnSm : {}), opacity: disabled ? 0.4 : 1, ...style }}>
      {children}
    </button>
  )
}

function Tag({ estado }) { return <span style={S.tag(estado)}>{estado}</span> }
function TypeBadge({ tipo }) { return <span style={S.typeBadge(tipo)}>{tipo}</span> }

function InfoBox({ label, value, style }) {
  return (
    <div style={{ ...S.infoBox, ...style }}>
      <div style={{ fontSize:'11px', color:'var(--text2)', marginBottom:'3px' }}>{label}</div>
      <div style={{ fontSize:'14px', fontWeight:'500' }}>{value || '—'}</div>
    </div>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    })
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={S.copyBtn}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      {copied ? 'Copiado!' : 'Copiar texto'}
    </button>
  )
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [clientes, setClientes] = useState(() => storage.get('clientes') || [])
  const [cuentas, setCuentas] = useState(() => storage.get('cuentas') || DEFAULT_CUENTAS)
  const [operaciones, setOperaciones] = useState(() => storage.get('operaciones') || [])
  const [view, setView] = useState('dashboard')
  const [modal, setModal] = useState(null) // { type, data }
  const [filtroOps, setFiltroOps] = useState('todas')
  const [opState, setOpState] = useState(newOpState())

  function newOpState() {
    return { step: 1, cliente: null, tipo: '', entrada: { moneda: '', monto: '' }, salida: { moneda: '', monto: '' }, cotizacion: '', comision: '', cuenta: null }
  }

  useEffect(() => { storage.set('clientes', clientes) }, [clientes])
  useEffect(() => { storage.set('cuentas', cuentas) }, [cuentas])
  useEffect(() => { storage.set('operaciones', operaciones) }, [operaciones])

  function navTo(v) { setView(v); setOpState(newOpState()) }

  const getCliente = id => clientes.find(c => c.id === id)
  const getCuenta = id => cuentas.find(c => c.id === id)

  function saveCliente(data) {
    if (data.id) {
      setClientes(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      const nuevo = { ...data, id: 'cl-' + Date.now() }
      setClientes(prev => [...prev, nuevo])
      return nuevo.id
    }
  }

  function deleteCliente(id) {
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  function saveCuenta(data) {
    if (data.id && cuentas.find(c => c.id === data.id)) {
      setCuentas(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      setCuentas(prev => [...prev, { ...data, id: 'ct-' + Date.now() }])
    }
  }

  function deleteCuenta(id) { setCuentas(prev => prev.filter(c => c.id !== id)) }

  function crearOperacion() {
    const op = opState
    const montoEnt = parseFloat(op.entrada.monto) || 0
    const cot = parseFloat(op.cotizacion) || 0
    const comPct = parseFloat(op.comision) || 0
    const montoSal = montoEnt * cot
    const comisionMonto = parseFloat((montoEnt * comPct / 100).toFixed(2))
    const nueva = {
      id: 'op-' + Date.now(),
      clienteId: op.cliente,
      tipo: op.tipo,
      entrada: { moneda: op.entrada.moneda, monto: montoEnt.toFixed(2) },
      salida: { moneda: op.salida.moneda, monto: montoSal.toFixed(2) },
      cotizacion: cot,
      comisionPct: comPct,
      comisionMonto,
      cuentaId: op.cuenta,
      estado: 'activa',
      fecha: new Date().toLocaleDateString('es-PY'),
      ref: genRef()
    }
    setOperaciones(prev => [...prev, nueva])
    setOpState(newOpState())
    navTo('operaciones')
  }

  function confirmarPago(id) {
    setOperaciones(prev => prev.map(o =>
      o.id === id ? { ...o, estado: 'concretada', fechaPago: new Date().toLocaleDateString('es-PY') } : o
    ))
    const op = operaciones.find(o => o.id === id)
    if (op) {
      const updated = { ...op, estado: 'concretada', fechaPago: new Date().toLocaleDateString('es-PY') }
      setTimeout(() => generarInvoice(updated, getCliente(op.clienteId), getCuenta(op.cuentaId)), 100)
    }
    setModal(null)
  }

  function cancelarOp(id) {
    if (!window.confirm('¿Cancelar esta operación?')) return
    setOperaciones(prev => prev.map(o => o.id === id ? { ...o, estado: 'cancelada' } : o))
    setModal(null)
  }

  // ── Views ──────────────────────────────────────────────────────────────────
  function Dashboard() {
    const concretadas = operaciones.filter(o => o.estado === 'concretada')
    const activas = operaciones.filter(o => o.estado === 'activa')
    const totalCom = concretadas.reduce((a, o) => a + (o.comisionMonto || 0), 0)
    const volumen = concretadas.reduce((a, o) => a + (parseFloat(o.entrada.monto) || 0), 0)
    return (
      <div>
        <div style={S.metricGrid}>
          <div style={S.metric}><div style={S.metricLabel}>Comisiones totales</div><div style={{ ...S.metricVal, color:'var(--green)' }}>${totalCom.toFixed(2)}</div></div>
          <div style={S.metric}><div style={S.metricLabel}>Concretadas</div><div style={{ ...S.metricVal, color:'var(--blue)' }}>{concretadas.length}</div></div>
          <div style={S.metric}><div style={S.metricLabel}>Activas</div><div style={{ ...S.metricVal, color:'var(--amber)' }}>{activas.length}</div></div>
          <div style={S.metric}><div style={S.metricLabel}>Volumen procesado</div><div style={S.metricVal}>${volumen.toFixed(2)}</div></div>
        </div>
        {activas.length > 0 && (
          <div style={S.card}>
            <div style={S.cardTitle}>Pendientes de pago</div>
            {activas.map(o => (
              <div key={o.id} style={S.opRow} onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ flex:1 }} onClick={() => setModal({ type:'verOp', id:o.id })}>
                  <div style={{ fontSize:'13px', fontWeight:'500' }}>{getCliente(o.clienteId)?.nombre || '?'} — <TypeBadge tipo={o.tipo} /></div>
                  <div style={{ fontSize:'11px', color:'var(--text2)', marginTop:'2px' }}>{o.entrada.monto} {o.entrada.moneda} → {o.salida.monto} {o.salida.moneda} · {o.fecha}</div>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <Btn sm variant="primary" onClick={() => confirmarPago(o.id)}>Confirmar pago</Btn>
                  <Btn sm variant="danger" onClick={() => cancelarOp(o.id)}>Cancelar</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={S.card}>
          <div style={S.cardTitle}>Operaciones recientes</div>
          {operaciones.length === 0
            ? <div style={S.empty}>Sin operaciones. <button style={{ ...S.btnPrimary, ...S.btnSm, marginLeft:'8px' }} onClick={() => navTo('nueva')}>Crear primera operación</button></div>
            : [...operaciones].reverse().slice(0, 6).map(o => (
              <div key={o.id} style={S.opRow} onClick={() => setModal({ type:'verOp', id:o.id })}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:'500' }}>{getCliente(o.clienteId)?.nombre || '?'} — <TypeBadge tipo={o.tipo} /></div>
                  <div style={{ fontSize:'11px', color:'var(--text2)', marginTop:'2px' }}>{o.entrada.monto} {o.entrada.moneda} → {o.salida.monto} {o.salida.moneda} · {o.fecha}</div>
                </div>
                <Tag estado={o.estado} />
              </div>
            ))
          }
        </div>
      </div>
    )
  }

  // ── Nueva Operación ────────────────────────────────────────────────────────
  function NuevaOp() {
    const steps = ['Cliente','Tipo','Montos','Cuenta','Confirmar']
    const { step } = opState
    return (
      <div>
        <div style={S.h2}>Nueva operación</div>
        <div style={{ ...S.card, marginTop:'16px' }}>
          <div style={S.stepBar}>
            {steps.map((s, i) => (
              <div key={s} style={S.step(i+1===step, i+1<step)}>{i+1}. {s}</div>
            ))}
          </div>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
          {step === 5 && <Step5 />}
        </div>
      </div>
    )
  }

  function Step1() {
    const [busq, setBusq] = useState('')
    const filtered = clientes.filter(c =>
      c.nombre.toLowerCase().includes(busq.toLowerCase()) ||
      (c.alias||'').toLowerCase().includes(busq.toLowerCase())
    )
    return (
      <div>
        <div style={S.cardTitle}>Seleccionar cliente</div>
        <div style={S.formRowFull}>
          <div><label style={S.label}>Buscar cliente</label>
          <input placeholder="Nombre o alias..." value={busq} onChange={e => setBusq(e.target.value)} /></div>
        </div>
        {filtered.map(c => (
          <div key={c.id} style={{ ...S.opRow }} onClick={() => setOpState(p => ({ ...p, cliente:c.id, step:2 }))}
            onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <div style={S.avatar()}>{initials(c.nombre)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight:'500' }}>{c.nombre} {c.alias && <span style={{ fontSize:'11px', color:'var(--text2)' }}>({c.alias})</span>}</div>
              <div style={{ fontSize:'11px', color:'var(--text3)' }}>{[c.nacionalidad, c.contacto].filter(Boolean).join(' · ')}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
        {filtered.length === 0 && busq && (
          <div style={{ ...S.empty, padding:'20px' }}>
            Sin resultados.{' '}
            <button style={{ ...S.btnPrimary, ...S.btnSm, marginLeft:'8px' }}
              onClick={() => setModal({ type:'nuevoCliente', preNombre:busq, onSave:(id) => setOpState(p => ({ ...p, cliente:id, step:2 })) })}>
              + Registrar "{busq}"
            </button>
          </div>
        )}
        {clientes.length === 0 && !busq && (
          <div style={{ marginTop:'8px' }}>
            <Btn variant="primary" onClick={() => setModal({ type:'nuevoCliente', onSave:(id) => setOpState(p => ({ ...p, cliente:id, step:2 })) })}>
              + Registrar nuevo cliente
            </Btn>
          </div>
        )}
      </div>
    )
  }

  function Step2() {
    const cliente = getCliente(opState.cliente)
    return (
      <div>
        <div style={S.cardTitle}>Tipo de operación</div>
        <InfoBox label="Cliente" value={cliente?.nombre} />
        <div style={S.formRowThree}>
          {['compra','venta','transferencia'].map(t => (
            <button key={t} onClick={() => setOpState(p => ({ ...p, tipo:t }))}
              style={{ padding:'20px 10px', borderRadius:'var(--radius-lg)', cursor:'pointer', fontSize:'13px', fontWeight: opState.tipo===t ? '500' : '400',
                border: opState.tipo===t ? '2px solid var(--green)' : '0.5px solid var(--border2)',
                background: opState.tipo===t ? 'var(--green-dim)' : 'var(--bg3)',
                color: opState.tipo===t ? 'var(--green)' : 'var(--text2)' }}>
              <div style={{ fontSize:'24px', marginBottom:'8px' }}>{t==='compra'?'↓':t==='venta'?'↑':'⇄'}</div>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'16px' }}>
          <Btn onClick={() => setOpState(p => ({ ...p, step:1 }))}>Atrás</Btn>
          <Btn variant="primary" disabled={!opState.tipo} onClick={() => setOpState(p => ({ ...p, step:3 }))}>Continuar</Btn>
        </div>
      </div>
    )
  }

  function Step3() {
    const op = opState
    const montoEnt = parseFloat(op.entrada.monto) || 0
    const cot = parseFloat(op.cotizacion) || 0
    const comPct = parseFloat(op.comision) || 0
    const montoSal = montoEnt * cot
    const comisionMonto = montoEnt * comPct / 100
    const upd = (field, val) => {
      if (field.includes('.')) {
        const [a, b] = field.split('.')
        setOpState(p => ({ ...p, [a]: { ...p[a], [b]: val } }))
      } else {
        setOpState(p => ({ ...p, [field]: val }))
      }
    }
    return (
      <div>
        <div style={S.cardTitle}>Montos y cotización</div>
        <div style={S.formRow}>
          <div><label style={S.label}>Moneda de entrada</label><input value={op.entrada.moneda} placeholder="USDT, BRL..." onChange={e => upd('entrada.moneda', e.target.value)} /></div>
          <div><label style={S.label}>Monto de entrada</label><input type="number" value={op.entrada.monto} placeholder="0.00" onChange={e => upd('entrada.monto', e.target.value)} /></div>
        </div>
        <div style={S.formRow}>
          <div><label style={S.label}>Moneda de salida</label><input value={op.salida.moneda} placeholder="BRL, PYG..." onChange={e => upd('salida.moneda', e.target.value)} /></div>
          <div><label style={S.label}>Cotización (1 entrada = X salida)</label><input type="number" value={op.cotizacion} placeholder="0.00" onChange={e => upd('cotizacion', e.target.value)} /></div>
        </div>
        <div style={S.formRow}>
          <div><label style={S.label}>Comisión (%)</label><input type="number" value={op.comision} placeholder="1.5" onChange={e => upd('comision', e.target.value)} /></div>
          <div />
        </div>
        {montoSal > 0 && (
          <div style={S.calcBox}>
            <div style={S.calcRow}><span>Monto entrada</span><span>{montoEnt.toFixed(2)} {op.entrada.moneda}</span></div>
            <div style={S.calcRow}><span>Cotización</span><span>{cot}</span></div>
            <div style={S.calcRow}><span>Monto salida</span><span>{montoSal.toFixed(2)} {op.salida.moneda}</span></div>
            <div style={S.calcRow}><span>Comisión ({comPct}%)</span><span>{comisionMonto.toFixed(2)} {op.entrada.moneda}</span></div>
            <div style={S.calcRowTotal}><span>Total neto cliente</span><span style={{ color:'var(--green)' }}>{(montoEnt - comisionMonto).toFixed(2)} {op.entrada.moneda}</span></div>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'16px' }}>
          <Btn onClick={() => setOpState(p => ({ ...p, step:2 }))}>Atrás</Btn>
          <Btn variant="primary" disabled={!montoSal} onClick={() => setOpState(p => ({ ...p, step:4 }))}>Continuar</Btn>
        </div>
      </div>
    )
  }

  function Step4() {
    return (
      <div>
        <div style={S.cardTitle}>Seleccionar cuenta de cobro</div>
        {cuentas.map(c => (
          <div key={c.id} style={{ ...S.opRow, border: opState.cuenta===c.id ? '2px solid var(--green)' : '0.5px solid var(--border)', background: opState.cuenta===c.id ? 'var(--green-dim)' : 'transparent' }}
            onClick={() => setOpState(p => ({ ...p, cuenta:c.id }))}
            onMouseEnter={e => { if(opState.cuenta!==c.id) e.currentTarget.style.background='var(--bg3)' }}
            onMouseLeave={e => { if(opState.cuenta!==c.id) e.currentTarget.style.background='transparent' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight:'500' }}>{c.nombre} <span style={{ fontSize:'11px', color:'var(--text2)' }}>{c.tipo} · {c.moneda}</span></div>
              <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'2px' }}>{c.direccion || c.numero || ''}</div>
            </div>
            {opState.cuenta===c.id && <span style={{ color:'var(--green)', fontSize:'16px' }}>✓</span>}
          </div>
        ))}
        {cuentas.length === 0 && <div style={S.empty}>Sin cuentas. <button style={{ ...S.btnPrimary, ...S.btnSm }} onClick={() => navTo('cuentas')}>Agregar cuenta</button></div>}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'16px' }}>
          <Btn onClick={() => setOpState(p => ({ ...p, step:3 }))}>Atrás</Btn>
          <Btn variant="primary" disabled={!opState.cuenta} onClick={() => setOpState(p => ({ ...p, step:5 }))}>Continuar</Btn>
        </div>
      </div>
    )
  }

  function Step5() {
    const op = opState
    const cliente = getCliente(op.cliente)
    const cuenta = getCuenta(op.cuenta)
    const montoEnt = parseFloat(op.entrada.monto) || 0
    const cot = parseFloat(op.cotizacion) || 0
    const comPct = parseFloat(op.comision) || 0
    const montoSal = montoEnt * cot
    const comisionMonto = montoEnt * comPct / 100
    const textoOp = `OPERACIÓN ${op.tipo.toUpperCase()} — ${(genRef())}
Cliente: ${cliente?.nombre || ''}${cliente?.alias ? ' (' + cliente.alias + ')' : ''}
Monto entrada: ${montoEnt.toFixed(2)} ${op.entrada.moneda}
Monto salida: ${montoSal.toFixed(2)} ${op.salida.moneda}
Cotización: ${cot}
Comisión: ${comisionMonto.toFixed(2)} ${op.entrada.moneda} (${comPct}%)

DATOS DE PAGO:
Cuenta: ${cuenta?.nombre || ''}
${cuenta?.tipo === 'crypto'
  ? `Red: ${cuenta?.red || ''}\nDirección: ${cuenta?.direccion || ''}`
  : `Nro. cuenta: ${cuenta?.numero || ''}\nAgencia: ${cuenta?.agencia || ''}`}`
    return (
      <div>
        <div style={S.cardTitle}>Resumen y datos de pago</div>
        <div style={S.formRow}>
          <InfoBox label="Cliente" value={cliente?.nombre} />
          <InfoBox label="Operación" value={op.tipo.charAt(0).toUpperCase() + op.tipo.slice(1)} />
        </div>
        <div style={S.formRowThree}>
          <InfoBox label="Entrada" value={`${montoEnt.toFixed(2)} ${op.entrada.moneda}`} />
          <InfoBox label="Salida" value={`${montoSal.toFixed(2)} ${op.salida.moneda}`} />
          <InfoBox label="Comisión" value={`${comisionMonto.toFixed(2)} ${op.entrada.moneda}`} />
        </div>
        <div style={S.accountBox}>
          <div style={{ fontSize:'12px', fontWeight:'500', color:'var(--green)', marginBottom:'8px' }}>Datos de pago — {cuenta?.nombre}</div>
          {cuenta?.tipo === 'crypto'
            ? <><div style={{ fontSize:'11px', color:'var(--green)', opacity:.7 }}>Red: {cuenta.red}</div>
                <div style={{ ...S.monoText, color:'var(--green)', marginTop:'4px' }}>{cuenta.direccion}</div></>
            : <><div style={{ fontSize:'12px', color:'var(--green)', opacity:.8 }}>Cuenta: {cuenta?.numero} · Agencia: {cuenta?.agencia}</div></>
          }
        </div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
          <CopyBtn text={textoOp} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px' }}>
          <Btn onClick={() => setOpState(p => ({ ...p, step:4 }))}>Atrás</Btn>
          <Btn variant="primary" onClick={crearOperacion}>Crear operación</Btn>
        </div>
      </div>
    )
  }

  // ── Operaciones ────────────────────────────────────────────────────────────
  function Operaciones() {
    const filtered = operaciones.filter(o => filtroOps === 'todas' || o.estado === filtroOps)
    return (
      <div>
        <div style={S.sectionHeader}>
          <div style={S.h2}>Operaciones</div>
        </div>
        <div style={S.filterBar}>
          {['todas','activa','concretada','cancelada'].map(f => (
            <button key={f} style={S.filterChip(filtroOps===f)} onClick={() => setFiltroOps(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0
          ? <div style={S.empty}>Sin operaciones{filtroOps !== 'todas' ? ' con estado ' + filtroOps : ''}</div>
          : [...filtered].reverse().map(o => (
            <div key={o.id} style={S.opRow}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ flex:1 }} onClick={() => setModal({ type:'verOp', id:o.id })}>
                <div style={{ fontSize:'13px', fontWeight:'500' }}>{getCliente(o.clienteId)?.nombre || '?'} — <TypeBadge tipo={o.tipo} /></div>
                <div style={{ fontSize:'11px', color:'var(--text2)', marginTop:'2px' }}>
                  {o.entrada.monto} {o.entrada.moneda} → {o.salida.monto} {o.salida.moneda} · {o.fecha} · Com: ${(o.comisionMonto||0).toFixed(2)}
                </div>
              </div>
              <Tag estado={o.estado} />
              <div style={{ display:'flex', gap:'6px' }}>
                {o.estado === 'activa' && <>
                  <Btn sm variant="primary" onClick={() => confirmarPago(o.id)}>Confirmar pago</Btn>
                  <Btn sm variant="danger" onClick={() => cancelarOp(o.id)}>Cancelar</Btn>
                </>}
                {o.estado === 'concretada' && <Btn sm onClick={() => generarInvoice(o, getCliente(o.clienteId), getCuenta(o.cuentaId))}>Invoice</Btn>}
              </div>
            </div>
          ))
        }
      </div>
    )
  }

  // ── Clientes ───────────────────────────────────────────────────────────────
  function Clientes() {
    return (
      <div>
        <div style={S.sectionHeader}>
          <div style={S.h2}>Clientes</div>
          <Btn variant="primary" onClick={() => setModal({ type:'nuevoCliente' })}>+ Nuevo cliente</Btn>
        </div>
        {clientes.length === 0
          ? <div style={S.empty}>Sin clientes registrados</div>
          : clientes.map(c => (
            <div key={c.id} style={{ ...S.opRow, cursor:'default' }}>
              <div style={S.avatar()}>{initials(c.nombre)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:'500' }}>{c.nombre} {c.alias && <span style={{ fontSize:'11px', color:'var(--text2)' }}>({c.alias})</span>}</div>
                <div style={{ fontSize:'11px', color:'var(--text3)' }}>{[c.nacionalidad, c.contacto, c.documento].filter(Boolean).join(' · ')}</div>
              </div>
              <Btn sm onClick={() => setModal({ type:'editarCliente', cliente:c })}>Editar</Btn>
            </div>
          ))
        }
      </div>
    )
  }

  // ── Cuentas ────────────────────────────────────────────────────────────────
  function Cuentas() {
    return (
      <div>
        <div style={S.sectionHeader}>
          <div style={S.h2}>Cuentas</div>
          <Btn variant="primary" onClick={() => setModal({ type:'nuevaCuenta' })}>+ Nueva cuenta</Btn>
        </div>
        {cuentas.map(c => (
          <div key={c.id} style={S.card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <div>
                <span style={{ fontSize:'14px', fontWeight:'500' }}>{c.nombre}</span>
                <span style={{ fontSize:'11px', color:'var(--text2)', marginLeft:'8px' }}>{c.tipo} · {c.moneda}</span>
              </div>
              <Btn sm onClick={() => setModal({ type:'editarCuenta', cuenta:c })}>Editar</Btn>
            </div>
            {c.tipo === 'crypto'
              ? <><div style={{ fontSize:'12px', color:'var(--text2)' }}>Red: {c.red}</div>
                  <div style={{ ...S.monoText, color:'var(--text2)', marginTop:'4px' }}>{c.direccion}</div></>
              : <div style={{ fontSize:'12px', color:'var(--text2)' }}>Cuenta: {c.numero} · Agencia: {c.agencia}</div>
            }
            {c.descripcion && <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'4px' }}>{c.descripcion}</div>}
          </div>
        ))}
      </div>
    )
  }

  // ── Modals ─────────────────────────────────────────────────────────────────
  function VerOpModal({ id }) {
    const op = operaciones.find(o => o.id === id)
    if (!op) return null
    const cliente = getCliente(op.clienteId)
    const cuenta = getCuenta(op.cuentaId)
    return (
      <div style={S.modalBg} onClick={() => setModal(null)}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ fontSize:'15px', fontWeight:'600', flex:1 }}>Operación {op.ref}</div>
            <Tag estado={op.estado} />
          </div>
          <div style={S.formRow}>
            <InfoBox label="Cliente" value={cliente?.nombre} />
            <InfoBox label="Tipo" value={op.tipo} />
          </div>
          <div style={S.formRowThree}>
            <InfoBox label="Entrada" value={`${op.entrada.monto} ${op.entrada.moneda}`} />
            <InfoBox label="Salida" value={`${op.salida.monto} ${op.salida.moneda}`} />
            <InfoBox label="Comisión" value={`$${(op.comisionMonto||0).toFixed(2)}`} />
          </div>
          {cuenta && (
            <div style={S.accountBox}>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'var(--green)', marginBottom:'6px' }}>{cuenta.nombre}</div>
              {cuenta.tipo === 'crypto'
                ? <><div style={{ fontSize:'11px', color:'var(--green)', opacity:.7 }}>Red: {cuenta.red}</div>
                    <div style={{ ...S.monoText, color:'var(--green)', marginTop:'4px' }}>{cuenta.direccion}</div></>
                : <div style={{ fontSize:'12px', color:'var(--green)', opacity:.8 }}>Cuenta: {cuenta.numero} · Agencia: {cuenta.agencia}</div>
              }
            </div>
          )}
          <div style={{ display:'flex', gap:'8px', marginTop:'14px', flexWrap:'wrap' }}>
            {op.estado === 'activa' && <>
              <Btn variant="primary" onClick={() => confirmarPago(op.id)}>Confirmar pago</Btn>
              <Btn variant="danger" onClick={() => cancelarOp(op.id)}>Cancelar operación</Btn>
            </>}
            {op.estado === 'concretada' && <Btn onClick={() => generarInvoice(op, cliente, cuenta)}>Ver invoice</Btn>}
            <Btn onClick={() => setModal(null)}>Cerrar</Btn>
          </div>
        </div>
      </div>
    )
  }

  function ClienteModal({ cliente, preNombre, onSave }) {
    const editing = !!cliente
    const [form, setForm] = useState(cliente || { nombre: preNombre||'', alias:'', nacionalidad:'', contacto:'', documento:'' })
    const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
    function submit() {
      if (!form.nombre.trim()) { alert('El nombre es requerido'); return }
      const data = { ...form, id: cliente?.id }
      const id = saveCliente(data)
      setModal(null)
      if (onSave) onSave(id || cliente?.id)
    }
    return (
      <div style={S.modalBg} onClick={() => setModal(null)}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize:'15px', fontWeight:'600', marginBottom:'16px' }}>{editing ? 'Editar' : 'Nuevo'} cliente</div>
          <div style={S.formRowFull}><label style={S.label}>Nombre completo *</label><input value={form.nombre} onChange={e => upd('nombre', e.target.value)} placeholder="Juan Pérez" /></div>
          <div style={S.formRow}>
            <div><label style={S.label}>Alias</label><input value={form.alias} onChange={e => upd('alias', e.target.value)} placeholder="juanp" /></div>
            <div><label style={S.label}>Nacionalidad</label><input value={form.nacionalidad} onChange={e => upd('nacionalidad', e.target.value)} placeholder="BR, PY, AR..." /></div>
          </div>
          <div style={S.formRow}>
            <div><label style={S.label}>Contacto / Telegram</label><input value={form.contacto} onChange={e => upd('contacto', e.target.value)} placeholder="+595 9XX..." /></div>
            <div><label style={S.label}>Pasaporte / DNI (opcional)</label><input value={form.documento} onChange={e => upd('documento', e.target.value)} placeholder="12345678" /></div>
          </div>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px', justifyContent:'flex-end' }}>
            {editing && <Btn variant="danger" onClick={() => { if(window.confirm('¿Eliminar cliente?')){ deleteCliente(cliente.id); setModal(null) } }}>Eliminar</Btn>}
            <Btn onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={submit}>Guardar</Btn>
          </div>
        </div>
      </div>
    )
  }

  function CuentaModal({ cuenta }) {
    const editing = !!cuenta
    const [form, setForm] = useState(cuenta || { nombre:'', tipo:'crypto', moneda:'', red:'', direccion:'', numero:'', agencia:'', descripcion:'' })
    const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
    function submit() {
      if (!form.nombre.trim()) { alert('El nombre es requerido'); return }
      saveCuenta({ ...form, id: cuenta?.id })
      setModal(null)
    }
    return (
      <div style={S.modalBg} onClick={() => setModal(null)}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize:'15px', fontWeight:'600', marginBottom:'16px' }}>{editing ? 'Editar' : 'Nueva'} cuenta</div>
          <div style={S.formRowFull}><label style={S.label}>Nombre de la cuenta</label><input value={form.nombre} onChange={e => upd('nombre', e.target.value)} placeholder="Binance Pay, Banco X..." /></div>
          <div style={S.formRow}>
            <div><label style={S.label}>Tipo</label>
              <select value={form.tipo} onChange={e => upd('tipo', e.target.value)}>
                <option value="crypto">Crypto</option>
                <option value="banco">Banco</option>
              </select>
            </div>
            <div><label style={S.label}>Moneda</label><input value={form.moneda} onChange={e => upd('moneda', e.target.value)} placeholder="USDT, BRL..." /></div>
          </div>
          {form.tipo === 'crypto' ? <>
            <div style={S.formRow}>
              <div><label style={S.label}>Red</label><input value={form.red} onChange={e => upd('red', e.target.value)} placeholder="BEP20, TRC20..." /></div>
              <div />
            </div>
            <div style={S.formRowFull}><label style={S.label}>Dirección / Wallet</label><input value={form.direccion} onChange={e => upd('direccion', e.target.value)} placeholder="0x..." /></div>
          </> : <>
            <div style={S.formRow}>
              <div><label style={S.label}>Número de cuenta</label><input value={form.numero} onChange={e => upd('numero', e.target.value)} placeholder="12345-6" /></div>
              <div><label style={S.label}>Agencia</label><input value={form.agencia} onChange={e => upd('agencia', e.target.value)} placeholder="0001" /></div>
            </div>
          </>}
          <div style={S.formRowFull}><label style={S.label}>Descripción (opcional)</label><input value={form.descripcion} onChange={e => upd('descripcion', e.target.value)} placeholder="Cuenta principal..." /></div>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px', justifyContent:'flex-end' }}>
            {editing && <Btn variant="danger" onClick={() => { if(window.confirm('¿Eliminar cuenta?')){ deleteCuenta(cuenta.id); setModal(null) } }}>Eliminar</Btn>}
            <Btn onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={submit}>Guardar</Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const navItems = [
    { id:'dashboard', label:'Dashboard' },
    { id:'nueva', label:'Nueva operación' },
    { id:'operaciones', label:'Operaciones' },
    { id:'clientes', label:'Clientes' },
    { id:'cuentas', label:'Cuentas' },
  ]

  return (
    <div style={S.app}>
      <div style={S.topbar}>
        <div style={S.brand}>Crypto<span style={S.brandAccent}>Desk</span></div>
        {navItems.map(n => (
          <button key={n.id} onClick={() => navTo(n.id)}
            style={{ padding:'6px 12px', borderRadius:'var(--radius)', border:'0.5px solid transparent', background: view===n.id ? 'var(--bg3)' : 'transparent',
              color: view===n.id ? 'var(--text)' : 'var(--text2)', fontSize:'13px', fontWeight: view===n.id ? '500' : '400',
              borderColor: view===n.id ? 'var(--border2)' : 'transparent' }}>
            {n.label}
          </button>
        ))}
      </div>
      <div style={S.main}>
        {view === 'dashboard' && <Dashboard />}
        {view === 'nueva' && <NuevaOp />}
        {view === 'operaciones' && <Operaciones />}
        {view === 'clientes' && <Clientes />}
        {view === 'cuentas' && <Cuentas />}
      </div>
      {modal?.type === 'verOp' && <VerOpModal id={modal.id} />}
      {(modal?.type === 'nuevoCliente' || modal?.type === 'editarCliente') && <ClienteModal cliente={modal.cliente} preNombre={modal.preNombre} onSave={modal.onSave} />}
      {(modal?.type === 'nuevaCuenta' || modal?.type === 'editarCuenta') && <CuentaModal cuenta={modal.cuenta} />}
    </div>
  )
}
