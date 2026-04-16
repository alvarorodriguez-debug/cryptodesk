import { useState, useEffect, useRef, useCallback } from 'react'
import { storage, DEFAULT_CUENTAS, initials, genRef } from './utils'
import { generarInvoice } from './invoice'

// ─── Constants ──────────────────────────────────────────────────────────────
const NACIONALIDADES = ['Afgana','Albanesa','Alemana','Andorrana','Angoleña','Antiguense','Árabe Saudita','Argentina','Armenia','Australiana','Austriaca','Azerbaiyana','Bahameña','Bangladesí','Barbadense','Bareiní','Belga','Beliceña','Beninesa','Bielorrusa','Birmana','Boliviana','Bosnia','Botsuanesa','Brasileña','Británica','Bruneana','Búlgara','Burkinesa','Burundesa','Butanesa','Caboverdiana','Cambodiana','Camerunesa','Canadiense','Catarí','Checa','Chilena','China','Chipriota','Colombiana','Comorense','Congoleña','Costarricense','Croata','Cubana','Danesa','Dominicana','Ecuatoriana','Egipcia','Salvadoreña','Emiratí','Eritrea','Eslovaca','Eslovena','Española','Estadounidense','Estonia','Etíope','Filipina','Finlandesa','Francesa','Gabonesa','Gambiana','Georgiana','Ghanesa','Granadina','Griega','Guatemalteca','Guineana','Guyanesa','Haitiana','Holandesa','Hondureña','Húngara','India','Indonesia','Iraní','Iraquí','Irlandesa','Islandesa','Israelí','Italiana','Jamaicana','Japonesa','Jordana','Kazaja','Keniana','Kirguís','Kiribatiana','Kuwaití','Laosiana','Lesotense','Letona','Libanesa','Liberiana','Libia','Liechtensteiniana','Lituana','Luxemburguesa','Macedónica','Malgache','Malasia','Malauí','Maldiviana','Maliense','Maltesa','Marfileña','Marroquí','Mauriciana','Mauritana','Mexicana','Micronesia','Moldava','Monegasca','Mongola','Montenegrina','Mozambiqueña','Namibiana','Nauruana','Nepalesa','Nicaragüense','Nigerina','Nigeriana','Noruega','Neozelandesa','Omaní','Pakistaní','Palauana','Palestina','Panameña','Papuana','Paraguaya','Peruana','Polaca','Portuguesa','Ruandesa','Rumana','Rusa','Samoana','San Marinesa','Santa Luciana','Santomentense','Senegalesa','Serbia','Seychellense','Sierraleonesa','Singapurense','Siria','Somalí','Sri Lankesa','Sudafricana','Sudanesa','Sueca','Suiza','Surinamesa','Tailandesa','Tanzana','Timorense','Togolesa','Tongana','Trinitense','Tunecina','Turca','Turcomana','Tuvaluana','Ugandesa','Ucraniana','Uruguaya','Uzbeka','Vanuatense','Venezolana','Vietnamita','Yemení','Yibutiana','Zambiana','Zimbabuense']
const TIPOS_BASE   = ['crypto','banco','efectivo']
const MONEDAS_BASE = ['USDT','USD','PYG','EUR','BRL','ARS']
const REDES_BASE   = ['TRC20','ERC20','BEP20','POLYGON','SOLANA']

// ─── Number formatting ───────────────────────────────────────────────────────
// Thousands separator: comma  |  Decimal separator: period
function fmt(n, decimals=2) {
  if (n==null||isNaN(n)) return '0.00'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtMoney(n, symbol='') { return (symbol?symbol+' ':'')+fmt(n,2) }

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  app:{ display:'flex', flexDirection:'column', minHeight:'100vh' },
  topbar:{ background:'var(--bg2)', borderBottom:'0.5px solid var(--border)', padding:'0 16px', display:'flex', alignItems:'center', gap:'4px', height:'52px', position:'sticky', top:0, zIndex:100, overflowX:'auto' },
  brand:{ fontSize:'15px', fontWeight:'600', marginRight:'8px', letterSpacing:'-0.3px', flexShrink:0, color:'var(--text)' },
  brandAccent:{ color:'var(--green)' },
  main:{ flex:1, padding:'24px 20px', maxWidth:'900px', width:'100%', margin:'0 auto' },
  card:{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border)', padding:'20px', marginBottom:'14px' },
  cardTitle:{ fontSize:'14px', fontWeight:'500', marginBottom:'16px' },
  row2:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' },
  row1:{ display:'grid', gridTemplateColumns:'1fr', gap:'12px', marginBottom:'12px' },
  row3:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'12px' },
  lbl:{ display:'block', fontSize:'11px', color:'var(--text2)', marginBottom:'4px', fontWeight:'500', letterSpacing:'0.3px' },
  btnBase:{ padding:'8px 16px', borderRadius:'var(--radius)', border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:'13px', cursor:'pointer' },
  btnPrimary:{ padding:'8px 16px', borderRadius:'var(--radius)', border:'none', background:'var(--green)', color:'#0a1a12', fontSize:'13px', fontWeight:'500', cursor:'pointer' },
  btnDanger:{ padding:'8px 16px', borderRadius:'var(--radius)', background:'var(--red-dim)', color:'var(--red)', fontSize:'13px', border:'0.5px solid rgba(255,90,90,0.3)', cursor:'pointer' },
  btnSm:{ padding:'5px 10px', fontSize:'12px' },
  mGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' },
  metric:{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'14px', border:'0.5px solid var(--border)' },
  mLabel:{ fontSize:'11px', color:'var(--text2)', marginBottom:'6px', fontWeight:'500' },
  mVal:{ fontSize:'22px', fontWeight:'600', letterSpacing:'-0.5px' },
  opRow:{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', borderRadius:'var(--radius)', border:'0.5px solid var(--border)', marginBottom:'6px', transition:'background .12s' },
  infoBox:{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:'10px' },
  tag: e=>{ const m={activa:['var(--amber-dim)','var(--amber)'],concretada:['var(--green-dim)','var(--green)'],cancelada:['var(--red-dim)','var(--red)']}; const [bg,c]=m[e]||['var(--bg3)','var(--text2)']; return {display:'inline-block',padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:'500',background:bg,color:c} },
  typeBadge: t=>{ const m={compra:['var(--blue-dim)','var(--blue)'],venta:['var(--amber-dim)','var(--amber)'],transferencia:['var(--purple-dim)','var(--purple)']}; const [bg,c]=m[t]||['var(--bg3)','var(--text2)']; return {display:'inline-block',padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:'500',background:bg,color:c} },
  avatar:{ width:36, height:36, borderRadius:'50%', background:'var(--green-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'600', fontSize:'12px', color:'var(--green)', flexShrink:0 },
  divider:{ border:'none', borderTop:'0.5px solid var(--border)', margin:'14px 0' },
  empty:{ textAlign:'center', padding:'40px 20px', color:'var(--text3)', fontSize:'13px' },
  stepBar:{ display:'flex', gap:'6px', marginBottom:'20px' },
  step:(a,d)=>({ flex:1, padding:'7px 10px', borderRadius:'var(--radius)', fontSize:'12px', textAlign:'center', border:a?'0.5px solid var(--green)':'0.5px solid var(--border)', background:a?'var(--green-dim)':d?'var(--bg3)':'transparent', color:a?'var(--green)':d?'var(--text2)':'var(--text3)', fontWeight:a?'500':'400' }),
  calcBox:{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'14px', marginTop:'12px', border:'0.5px solid var(--border)' },
  calcRow:{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:'13px', color:'var(--text2)' },
  calcTotal:{ display:'flex', justifyContent:'space-between', padding:'8px 0 4px', fontSize:'14px', fontWeight:'500', borderTop:'0.5px solid var(--border2)', marginTop:'6px', color:'var(--text)' },
  accountBox:{ background:'var(--green-dim)', border:'0.5px solid var(--green-border)', borderRadius:'var(--radius)', padding:'14px', margin:'12px 0' },
  filterBar:{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' },
  chip: a=>({ padding:'5px 12px', borderRadius:'20px', border:'0.5px solid '+(a?'var(--border2)':'var(--border)'), background:a?'var(--bg3)':'transparent', cursor:'pointer', fontSize:'12px', color:a?'var(--text)':'var(--text3)' }),
  modalBg:{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  modal:{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border2)', padding:'24px', width:'100%', maxWidth:'520px', maxHeight:'92vh', overflowY:'auto' },
  modalWide:{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', border:'0.5px solid var(--border2)', padding:'24px', width:'100%', maxWidth:'620px', maxHeight:'92vh', overflowY:'auto' },
  sectionHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' },
  h2:{ fontSize:'18px', fontWeight:'600', letterSpacing:'-0.3px' },
  copyBtn:{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'var(--radius)', border:'0.5px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', fontSize:'12px', cursor:'pointer' },
  mono:{ fontFamily:'var(--font-mono,monospace)', fontSize:'11px', wordBreak:'break-all', lineHeight:1.6 },
}

// ─── Shared UI components (all outside App = stable identity) ────────────────
function Btn({ children, onClick, style, variant='base', sm, disabled }) {
  const base = variant==='primary'?S.btnPrimary:variant==='danger'?S.btnDanger:S.btnBase
  return <button onClick={onClick} disabled={disabled} style={{...base,...(sm?S.btnSm:{}),...style,opacity:disabled?.4:1}}>{children}</button>
}
function Tag({ estado }) { return <span style={S.tag(estado)}>{estado}</span> }
function TypeBadge({ tipo }) { return <span style={S.typeBadge(tipo)}>{tipo}</span> }
function InfoBox({ label, value, style }) {
  return <div style={{...S.infoBox,...style}}><div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'3px'}}>{label}</div><div style={{fontSize:'14px',fontWeight:'500'}}>{value||'—'}</div></div>
}
function CopyBtn({ text }) {
  const [copied,setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).catch(()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t)})
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }
  return <button onClick={copy} style={S.copyBtn}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>{copied?'Copiado!':'Copiar texto'}</button>
}
function ComboSelect({ label, value, options, onChange, onAddCustom, placeholder }) {
  const isCustom = value && !options.includes(value)
  const [showCustom,setShowCustom] = useState(isCustom)
  const [customVal,setCustomVal]   = useState(isCustom?value:'')
  function handleSelect(e) {
    if(e.target.value==='__custom__'){setShowCustom(true);setCustomVal('');onChange('')}
    else{setShowCustom(false);onChange(e.target.value)}
  }
  function confirm() { const v=customVal.trim();if(!v)return;onAddCustom(v);onChange(v);setShowCustom(false) }
  return (
    <div>
      <label style={S.lbl}>{label}</label>
      <select value={showCustom?'__custom__':(value||'')} onChange={handleSelect}>
        <option value="" disabled>Seleccionar...</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
        <option value="__custom__">+ Agregar nuevo...</option>
      </select>
      {showCustom&&<div style={{display:'flex',gap:'6px',marginTop:'6px'}}><input autoFocus value={customVal} onChange={e=>setCustomVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirm()} placeholder={placeholder||'Nuevo valor...'} style={{flex:1}}/><Btn sm variant="primary" onClick={confirm}>OK</Btn><Btn sm onClick={()=>{setShowCustom(false);onChange(options[0]||'')}}>✕</Btn></div>}
    </div>
  )
}

// ─── Wizard Step components (OUTSIDE App — critical for focus stability) ─────

function WizStep1({ clientes, opData, updOp, setOpStep, setModal }) {
  const [busq,setBusq] = useState('')
  const filtered = clientes.filter(c=>
    c.nombre.toLowerCase().includes(busq.toLowerCase())||
    (c.alias||'').toLowerCase().includes(busq.toLowerCase())
  )
  return (
    <div>
      <div style={S.cardTitle}>Seleccionar cliente</div>
      <div style={{marginBottom:'12px'}}><label style={S.lbl}>Buscar cliente</label><input placeholder="Nombre o alias..." value={busq} onChange={e=>setBusq(e.target.value)}/></div>
      {filtered.map(c=>(
        <div key={c.id} style={{...S.opRow,cursor:'pointer'}} onClick={()=>{updOp('cliente',c.id);setOpStep(2)}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={S.avatar}>{initials(c.nombre)}</div>
          <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'500'}}>{c.nombre}{c.alias&&<span style={{fontSize:'11px',color:'var(--text2)'}}> ({c.alias})</span>}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{[c.email,c.telefono,c.telegram].filter(Boolean).join(' · ')}</div></div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      ))}
      {filtered.length===0&&busq&&<div style={{...S.empty,padding:'20px'}}>Sin resultados. <button style={{...S.btnPrimary,...S.btnSm,marginLeft:'8px'}} onClick={()=>setModal({type:'nuevoCliente',preNombre:busq,onSave:id=>{updOp('cliente',id);setOpStep(2)}})}>+ Registrar "{busq}"</button></div>}
      {clientes.length===0&&!busq&&<Btn variant="primary" onClick={()=>setModal({type:'nuevoCliente',onSave:id=>{updOp('cliente',id);setOpStep(2)}})}>+ Registrar nuevo cliente</Btn>}
    </div>
  )
}

function WizStep2({ opData, updOp, setOpStep, getCliente }) {
  return (
    <div>
      <div style={S.cardTitle}>Tipo de operación</div>
      <InfoBox label="Cliente" value={getCliente(opData.cliente)?.nombre}/>
      <div style={S.row3}>
        {['compra','venta','transferencia'].map(t=>(
          <button key={t} onClick={()=>updOp('tipo',t)} style={{padding:'20px 10px',borderRadius:'var(--radius-lg)',cursor:'pointer',fontSize:'13px',fontWeight:opData.tipo===t?'500':'400',border:opData.tipo===t?'2px solid var(--green)':'0.5px solid var(--border2)',background:opData.tipo===t?'var(--green-dim)':'var(--bg3)',color:opData.tipo===t?'var(--green)':'var(--text2)'}}>
            <div style={{fontSize:'24px',marginBottom:'8px'}}>{t==='compra'?'↓':t==='venta'?'↑':'⇄'}</div>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'16px'}}>
        <Btn onClick={()=>setOpStep(1)}>Atrás</Btn>
        <Btn variant="primary" disabled={!opData.tipo} onClick={()=>setOpStep(3)}>Continuar</Btn>
      </div>
    </div>
  )
}

// KEY FIX: This component is defined at module level and receives opData+updOp as props.
// React sees the same component reference on every render → no unmount → no focus loss.
function WizStep3({ opData, updOp, setOpStep }) {
  const d = opData
  const montoEnt = parseFloat(d.entMonto)||0
  const montoSal = parseFloat(d.salMonto)||0
  const comPct   = parseFloat(d.comision)||0
  const comMonto = montoEnt * Math.abs(comPct) / 100
  const netoCliente = montoSal - (comPct>=0 ? comMonto : -comMonto)
  return (
    <div>
      <div style={S.cardTitle}>Montos y comisión</div>
      <div style={S.row2}>
        <div><label style={S.lbl}>Moneda de entrada</label><input value={d.entMoneda} onChange={e=>updOp('entMoneda',e.target.value)} placeholder="USDT, BRL..."/></div>
        <div><label style={S.lbl}>Monto de entrada</label><input type="number" value={d.entMonto} onChange={e=>updOp('entMonto',e.target.value)} placeholder="0.00"/></div>
      </div>
      <div style={S.row2}>
        <div><label style={S.lbl}>Moneda de salida</label><input value={d.salMoneda} onChange={e=>updOp('salMoneda',e.target.value)} placeholder="PYG, USD..."/></div>
        <div><label style={S.lbl}>Monto de salida</label><input type="number" value={d.salMonto} onChange={e=>updOp('salMonto',e.target.value)} placeholder="0.00"/></div>
      </div>
      <div style={S.row2}>
        <div><label style={S.lbl}>Referencia</label><input value={d.referencia} onChange={e=>updOp('referencia',e.target.value)} placeholder="Nro. orden, código..."/></div>
        <div><label style={S.lbl}>Comisión (%) <span style={{color:'var(--text3)',fontWeight:'400',fontSize:'10px'}}>positivo o negativo</span></label><input type="number" step="0.01" value={d.comision} onChange={e=>updOp('comision',e.target.value)} placeholder="1.5 o -1.5"/></div>
      </div>
      {montoSal>0&&(
        <div style={S.calcBox}>
          <div style={S.calcRow}><span>Monto entrada</span><span>{fmt(montoEnt,4)} {d.entMoneda}</span></div>
          <div style={S.calcRow}><span>Monto salida</span><span>{fmt(montoSal,4)} {d.salMoneda}</span></div>
          {comPct!==0&&<div style={S.calcRow}><span>Comisión ({comPct}%)</span><span style={{color:comPct>=0?'var(--red)':'var(--green)'}}>{comPct>=0?'- ':'+ '}{fmt(comMonto,4)} {d.salMoneda}</span></div>}
          <div style={S.calcTotal}><span>Total neto cliente</span><span style={{color:'var(--green)'}}>{fmt(netoCliente,4)} {d.salMoneda}</span></div>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'16px'}}>
        <Btn onClick={()=>setOpStep(2)}>Atrás</Btn>
        <Btn variant="primary" disabled={!montoSal||!d.entMoneda||!d.salMoneda} onClick={()=>setOpStep(4)}>Continuar</Btn>
      </div>
    </div>
  )
}

function WizStep4({ opData, updOp, setOpStep, cuentas, navTo }) {
  const esTrans = opData.tipo==='transferencia'
  function CuentaItem({c, selected, color='green', onSelect}) {
    const border = selected ? `2px solid var(--${color})` : '0.5px solid var(--border)'
    const bg     = selected ? `var(--${color}-dim)` : 'transparent'
    return (
      <div style={{...S.opRow,cursor:'pointer',border,background:bg}} onClick={onSelect}
        onMouseEnter={e=>{if(!selected)e.currentTarget.style.background='var(--bg3)'}}
        onMouseLeave={e=>{if(!selected)e.currentTarget.style.background=bg}}>
        <div style={{flex:1}}>
          <div style={{fontSize:'13px',fontWeight:'500'}}>{c.nombre} <span style={{fontSize:'11px',color:'var(--text2)'}}>{c.tipo} · {c.moneda}</span></div>
          <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>{c.saldo!=null?`Saldo: ${fmt(c.saldo,2)} ${c.moneda}`:''}</div>
        </div>
        {selected&&<span style={{color:`var(--${color})`}}>✓</span>}
      </div>
    )
  }
  return (
    <div>
      <div style={S.cardTitle}>{esTrans?'Cuentas origen y destino':'Cuenta de entrada y salida'}</div>
      {!esTrans&&<div style={{fontSize:'12px',color:'var(--text2)',marginBottom:'10px'}}>Elegí la cuenta que recibe el monto <strong>de entrada</strong> y la cuenta de donde sale el monto <strong>de salida</strong>.</div>}
      {esTrans&&<div style={{fontSize:'12px',color:'var(--text2)',marginBottom:'10px'}}>El saldo se resta de origen y se suma en destino.</div>}

      <label style={{...S.lbl,marginBottom:'8px'}}>{esTrans?'Cuenta origen':'Cuenta de entrada (recibe)'}</label>
      {cuentas.map(c=><CuentaItem key={c.id} c={c} selected={opData.cuentaEntrada===c.id} color="green" onSelect={()=>updOp('cuentaEntrada',c.id)}/>)}

      {!esTrans&&(
        <>
          <label style={{...S.lbl,margin:'12px 0 8px'}}>Cuenta de salida (entrega)</label>
          {cuentas.map(c=><CuentaItem key={c.id} c={c} selected={opData.cuentaSalida===c.id} color="amber" onSelect={()=>updOp('cuentaSalida',c.id)}/>)}
        </>
      )}
      {esTrans&&(
        <>
          <label style={{...S.lbl,margin:'12px 0 8px'}}>Cuenta destino</label>
          {cuentas.filter(c=>c.id!==opData.cuentaEntrada).map(c=><CuentaItem key={c.id} c={c} selected={opData.cuentaSalida===c.id} color="purple" onSelect={()=>updOp('cuentaSalida',c.id)}/>)}
        </>
      )}

      {cuentas.length===0&&<div style={S.empty}>Sin cuentas. <button style={{...S.btnPrimary,...S.btnSm}} onClick={()=>navTo('cuentas')}>Agregar cuenta</button></div>}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'16px'}}>
        <Btn onClick={()=>setOpStep(3)}>Atrás</Btn>
        <Btn variant="primary" disabled={!opData.cuentaEntrada} onClick={()=>setOpStep(5)}>Continuar</Btn>
      </div>
    </div>
  )
}

function WizStep5({ opData, setOpStep, crearOperacion, getCliente, getCuenta }) {
  const d = opData
  const cliente = getCliente(d.cliente)
  const cEnt  = getCuenta(d.cuentaEntrada)
  const cSal  = getCuenta(d.cuentaSalida)
  const montoEnt = parseFloat(d.entMonto)||0
  const montoSal = parseFloat(d.salMonto)||0
  const comPct   = parseFloat(d.comision)||0
  const comMonto = montoEnt * Math.abs(comPct) / 100
  const netoCliente = montoSal - (comPct>=0?comMonto:-comMonto)
  const texto = `OPERACIÓN ${d.tipo.toUpperCase()}
Cliente: ${cliente?.nombre||''}${cliente?.alias?' ('+cliente.alias+')':''}
Monto entrada: ${fmt(montoEnt,4)} ${d.entMoneda}
Monto salida: ${fmt(montoSal,4)} ${d.salMoneda}${d.referencia?'\nReferencia: '+d.referencia:''}
Comisión: ${comPct}%
Neto cliente: ${fmt(netoCliente,4)} ${d.salMoneda}

DATOS DE PAGO:
Cuenta entrada: ${cEnt?.nombre||''}
${cEnt?.tipo==='crypto'?`Red: ${cEnt?.red||''}\nDirección: ${cEnt?.direccion||''}`:`Nro: ${cEnt?.numero||''} · Agencia: ${cEnt?.agencia||''}`}`
  return (
    <div>
      <div style={S.cardTitle}>Resumen</div>
      <div style={S.row2}><InfoBox label="Cliente" value={cliente?.nombre}/><InfoBox label="Tipo" value={d.tipo}/></div>
      <div style={S.row3}><InfoBox label="Entrada" value={`${fmt(montoEnt,4)} ${d.entMoneda}`}/><InfoBox label="Salida" value={`${fmt(montoSal,4)} ${d.salMoneda}`}/><InfoBox label="Neto cliente" value={`${fmt(netoCliente,4)} ${d.salMoneda}`}/></div>
      {d.referencia&&<InfoBox label="Referencia" value={d.referencia}/>}
      {cEnt&&<div style={S.accountBox}><div style={{fontSize:'12px',fontWeight:'500',color:'var(--green)',marginBottom:'6px'}}>Cuenta entrada — {cEnt.nombre}</div>{cEnt.tipo==='crypto'?<><div style={{fontSize:'11px',color:'var(--green)',opacity:.7}}>Red: {cEnt.red}</div><div style={{...S.mono,color:'var(--green)',marginTop:'4px'}}>{cEnt.direccion}</div></>:<div style={{fontSize:'12px',color:'var(--green)',opacity:.8}}>Cuenta: {cEnt.numero} · Agencia: {cEnt.agencia}</div>}</div>}
      {cSal&&<div style={{...S.accountBox,background:'var(--amber-dim)',border:'0.5px solid rgba(245,166,35,0.3)'}}><div style={{fontSize:'12px',fontWeight:'500',color:'var(--amber)',marginBottom:'4px'}}>Cuenta salida — {cSal.nombre}</div><div style={{fontSize:'12px',color:'var(--amber)',opacity:.8}}>{cSal.moneda}</div></div>}
      <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><CopyBtn text={texto}/></div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px'}}>
        <Btn onClick={()=>setOpStep(4)}>Atrás</Btn>
        <Btn variant="primary" onClick={crearOperacion}>Crear operación</Btn>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [clientes,    setClientes]    = useState(()=>storage.get('clientes')||[])
  const [cuentas,     setCuentas]     = useState(()=>storage.get('cuentas')||DEFAULT_CUENTAS)
  const [operaciones, setOperaciones] = useState(()=>storage.get('operaciones')||[])
  const [view,        setView]        = useState('dashboard')
  const [modal,       setModal]       = useState(null)
  const [filtroOps,   setFiltroOps]   = useState('todas')

  // Wizard state at App level
  const [opStep, setOpStep] = useState(1)
  const [opData, setOpData] = useState(freshOp())
  function freshOp() { return { cliente:null, tipo:'', entMoneda:'', entMonto:'', salMoneda:'', salMonto:'', referencia:'', comision:'', cuentaEntrada:null, cuentaSalida:null } }
  function resetOp() { setOpStep(1); setOpData(freshOp()) }
  const updOp = useCallback((k,v) => setOpData(p=>({...p,[k]:v})), [])

  // Catalogs
  const [tiposExtra,   setTiposExtra]   = useState(()=>storage.get('opt_tipos')||[])
  const [monedasExtra, setMonedasExtra] = useState(()=>storage.get('opt_monedas')||[])
  const [redesExtra,   setRedesExtra]   = useState(()=>storage.get('opt_redes')||[])

  // FX rates (USD base)
  const [rates, setRates] = useState({})
  const [ratesUpdated, setRatesUpdated] = useState(null)

  useEffect(()=>{
    fetchRates()
    const interval = setInterval(fetchRates, 5*60*1000) // refresh every 5 min
    return ()=>clearInterval(interval)
  },[])

  async function fetchRates() {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,BRL,ARS,PYG,GBP,CLP,UYU')
      const json = await res.json()
      // Add stablecoins manually (1:1 with USD)
      const r = { ...json.rates, USD:1, USDT:1, USDC:1, DAI:1 }
      setRates(r)
      setRatesUpdated(new Date().toLocaleTimeString('es-PY',{hour:'2-digit',minute:'2-digit'}))
    } catch(e) {
      // silently fail — rates just won't show
    }
  }

  // Convert any amount+currency to USD
  function toUSD(amount, currency) {
    const a = parseFloat(amount)||0
    const upper = (currency||'').toUpperCase()
    if (upper==='USD'||upper==='USDT'||upper==='USDC'||upper==='DAI') return a
    const rate = rates[upper]
    if (!rate) return null // unknown currency
    return a / rate
  }

  useEffect(()=>{ storage.set('clientes',clientes) },[clientes])
  useEffect(()=>{ storage.set('cuentas',cuentas) },[cuentas])
  useEffect(()=>{ storage.set('operaciones',operaciones) },[operaciones])

  function navTo(v) { setView(v); resetOp() }

  const getCliente = id => clientes.find(c=>c.id===id)
  const getCuenta  = id => cuentas.find(c=>c.id===id)

  // ── Client CRUD ──
  function saveCliente(data) {
    if(data.id){setClientes(p=>p.map(c=>c.id===data.id?data:c));return data.id}
    const n={...data,id:'cl-'+Date.now()};setClientes(p=>[...p,n]);return n.id
  }
  function deleteCliente(id){setClientes(p=>p.filter(c=>c.id!==id))}

  // ── Cuenta CRUD ──
  function saveCuenta(data){
    if(data.id&&cuentas.find(c=>c.id===data.id)){setCuentas(p=>p.map(c=>c.id===data.id?data:c))}
    else{setCuentas(p=>[...p,{...data,id:'ct-'+Date.now()}])}
  }
  function deleteCuenta(id){setCuentas(p=>p.filter(c=>c.id!==id))}

  // ── Balance update on confirm ──
  function applyBalances(op, snap) {
    const ent = parseFloat(op.entrada.monto)||0
    const sal = parseFloat(op.salida.monto)||0
    return snap.map(c => {
      let saldo = parseFloat(c.saldo)||0
      // cuenta de entrada: recibe el monto de entrada (suma)
      if (c.id===op.cuentaEntradaId) saldo += ent
      // cuenta de salida: entrega el monto de salida (resta)
      if (c.id===op.cuentaSalidaId) saldo -= sal
      return {...c, saldo:parseFloat(saldo.toFixed(8))}
    })
  }

  // ── Create op ──
  function crearOperacion() {
    const d = opData
    const montoEnt = parseFloat(d.entMonto)||0
    const montoSal = parseFloat(d.salMonto)||0
    const comPct   = parseFloat(d.comision)||0
    const comMonto = parseFloat((montoEnt * Math.abs(comPct) / 100).toFixed(8))
    const nueva = {
      id:'op-'+Date.now(), clienteId:d.cliente, tipo:d.tipo,
      entrada:{moneda:d.entMoneda, monto:montoEnt.toString()},
      salida:{moneda:d.salMoneda, monto:montoSal.toString()},
      referencia:d.referencia, comisionPct:comPct, comisionMonto:comMonto,
      cuentaEntradaId:d.cuentaEntrada, cuentaSalidaId:d.cuentaSalida||null,
      // keep cuentaId for invoice backward compat
      cuentaId:d.cuentaEntrada,
      estado:'activa', fecha:new Date().toLocaleDateString('es-PY'), ref:genRef(), comprobantes:[]
    }
    setOperaciones(p=>[...p,nueva])
    resetOp(); navTo('operaciones')
  }

  function confirmarPago(id) {
    const op = operaciones.find(o=>o.id===id)
    if(!op) return
    const confirmed = {...op, estado:'concretada', fechaPago:new Date().toLocaleDateString('es-PY')}
    setOperaciones(p=>p.map(o=>o.id===id?confirmed:o))
    setCuentas(snap=>applyBalances(confirmed,snap))
    setTimeout(()=>generarInvoice(confirmed,getCliente(op.clienteId),getCuenta(op.cuentaEntradaId||op.cuentaId)),100)
    setModal(null)
  }

  function cancelarOp(id){
    if(!window.confirm('¿Cancelar esta operación?'))return
    setOperaciones(p=>p.map(o=>o.id===id?{...o,estado:'cancelada'}:o))
    setModal(null)
  }

  function addComprobante(opId,files){
    const readers=Array.from(files).map(f=>new Promise(res=>{const r=new FileReader();r.onload=e=>res({name:f.name,type:f.type,data:e.target.result});r.readAsDataURL(f)}))
    Promise.all(readers).then(nf=>{setOperaciones(p=>p.map(o=>o.id===opId?{...o,comprobantes:[...(o.comprobantes||[]),...nf]}:o))})
  }
  function removeComprobante(opId,idx){setOperaciones(p=>p.map(o=>o.id===opId?{...o,comprobantes:(o.comprobantes||[]).filter((_,i)=>i!==idx)}:o))}

  // ── P&L helper ──
  function calcPnL(op) {
    // Profit = commission amount, sign depends on comisionPct sign
    const comPct = parseFloat(op.comisionPct)||0
    const montoEnt = parseFloat(op.entrada.monto)||0
    const comMonto = montoEnt * Math.abs(comPct) / 100
    const sign = comPct >= 0 ? 1 : -1
    return { monto: comMonto * sign, moneda: op.entrada.moneda }
  }

  // ════════════════════ VIEWS ════════════════════════════════════════════════

  function Dashboard() {
    const concretadas = operaciones.filter(o=>o.estado==='concretada')
    const activas     = operaciones.filter(o=>o.estado==='activa')

    // Compute totals in USD
    let totalComUSD = 0, volUSD = 0, totalComKnown = true, volKnown = true
    concretadas.forEach(o=>{
      const pnl = calcPnL(o)
      const c = toUSD(pnl.monto, pnl.moneda)
      if(c===null) totalComKnown=false; else totalComUSD+=c
      const v = toUSD(o.entrada.monto, o.entrada.moneda)
      if(v===null) volKnown=false; else volUSD+=v
    })

    return (
      <div>
        <div style={S.mGrid}>
          <div style={S.metric}>
            <div style={S.mLabel}>Comisiones (USD)</div>
            <div style={{...S.mVal,color:'var(--green)'}}>{totalComKnown?'$'+fmt(totalComUSD):'~$'+fmt(totalComUSD)}</div>
            {ratesUpdated&&<div style={{fontSize:'10px',color:'var(--text3)',marginTop:'4px'}}>Tasas: {ratesUpdated}</div>}
          </div>
          <div style={S.metric}><div style={S.mLabel}>Volumen (USD)</div><div style={{...S.mVal,color:'var(--blue)'}}>{volKnown?'$'+fmt(volUSD):'~$'+fmt(volUSD)}</div></div>
          <div style={S.metric}><div style={S.mLabel}>Concretadas</div><div style={S.mVal}>{concretadas.length}</div></div>
          <div style={S.metric}><div style={S.mLabel}>Activas</div><div style={{...S.mVal,color:'var(--amber)'}}>{activas.length}</div></div>
        </div>

        {/* FX Rates widget */}
        {Object.keys(rates).length>0&&(
          <div style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div style={S.cardTitle} style={{marginBottom:0}}>Cotizaciones en vivo</div>
              <button onClick={fetchRates} style={{...S.btnBase,padding:'4px 10px',fontSize:'11px'}}>↻ Actualizar</button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {['EUR','BRL','ARS','PYG','GBP'].filter(k=>rates[k]).map(k=>(
                <div key={k} style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:'var(--radius)',padding:'8px 14px',minWidth:'100px'}}>
                  <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'2px'}}>1 USD</div>
                  <div style={{fontSize:'14px',fontWeight:'500'}}>{fmt(rates[k],4)} {k}</div>
                </div>
              ))}
              <div style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:'var(--radius)',padding:'8px 14px',minWidth:'100px'}}>
                <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'2px'}}>USDT / USDC</div>
                <div style={{fontSize:'14px',fontWeight:'500'}}>1.0000 USD</div>
              </div>
            </div>
          </div>
        )}

        {activas.length>0&&(
          <div style={S.card}>
            <div style={S.cardTitle}>Pendientes de pago</div>
            {activas.map(o=>{
              const pnl=calcPnL(o)
              return (
                <div key={o.id} style={{...S.opRow,cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{flex:1,cursor:'pointer'}} onClick={()=>setModal({type:'verOp',id:o.id})}>
                    <div style={{fontSize:'13px',fontWeight:'500'}}>{getCliente(o.clienteId)?.nombre||'?'} — <TypeBadge tipo={o.tipo}/></div>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>{fmt(o.entrada.monto,2)} {o.entrada.moneda} → {fmt(o.salida.monto,2)} {o.salida.moneda} · {o.fecha}</div>
                  </div>
                  <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                    <Btn sm variant="primary" onClick={()=>confirmarPago(o.id)}>Confirmar pago</Btn>
                    <Btn sm variant="danger" onClick={()=>cancelarOp(o.id)}>Cancelar</Btn>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={S.card}>
          <div style={S.cardTitle}>Operaciones recientes</div>
          {operaciones.length===0
            ?<div style={S.empty}>Sin operaciones. <button style={{...S.btnPrimary,...S.btnSm,marginLeft:'8px'}} onClick={()=>navTo('nueva')}>Crear primera</button></div>
            :[...operaciones].reverse().slice(0,6).map(o=>{
              const pnl=calcPnL(o)
              const pnlSign = pnl.monto>=0?'+':''
              return (
                <div key={o.id} style={{...S.opRow,cursor:'pointer'}} onClick={()=>setModal({type:'verOp',id:o.id})} onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:'500'}}>{getCliente(o.clienteId)?.nombre||'?'} — <TypeBadge tipo={o.tipo}/></div>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>{fmt(o.entrada.monto,2)} {o.entrada.moneda} → {fmt(o.salida.monto,2)} {o.salida.moneda} · {o.fecha}</div>
                  </div>
                  <div style={{textAlign:'right',marginRight:'8px'}}>
                    <div style={{fontSize:'12px',fontWeight:'600',color:pnl.monto>=0?'var(--green)':'var(--red)'}}>{pnlSign}{fmt(pnl.monto,4)} {pnl.moneda}</div>
                    <div style={{fontSize:'10px',color:'var(--text3)'}}>ganancia/pérdida</div>
                  </div>
                  <Tag estado={o.estado}/>
                </div>
              )
            })
          }
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Saldos de cuentas</div>
          {cuentas.length===0&&<div style={{fontSize:'12px',color:'var(--text3)'}}>Sin cuentas registradas.</div>}
          {cuentas.map(c=>(
            <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'0.5px solid var(--border)'}}>
              <div><div style={{fontSize:'13px',fontWeight:'500'}}>{c.nombre}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{c.tipo} · {c.moneda}</div></div>
              <div style={{fontSize:'14px',fontWeight:'600',color:(parseFloat(c.saldo)||0)>=0?'var(--green)':'var(--red)'}}>{fmt(parseFloat(c.saldo)||0,2)} {c.moneda}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function NuevaOp() {
    const steps=['Cliente','Tipo','Montos','Cuenta','Confirmar']
    return (
      <div>
        <div style={S.h2}>Nueva operación</div>
        <div style={{...S.card,marginTop:'16px'}}>
          <div style={S.stepBar}>{steps.map((s,i)=><div key={s} style={S.step(i+1===opStep,i+1<opStep)}>{i+1}. {s}</div>)}</div>
          {opStep===1&&<WizStep1 clientes={clientes} opData={opData} updOp={updOp} setOpStep={setOpStep} setModal={setModal}/>}
          {opStep===2&&<WizStep2 opData={opData} updOp={updOp} setOpStep={setOpStep} getCliente={getCliente}/>}
          {opStep===3&&<WizStep3 opData={opData} updOp={updOp} setOpStep={setOpStep}/>}
          {opStep===4&&<WizStep4 opData={opData} updOp={updOp} setOpStep={setOpStep} cuentas={cuentas} navTo={navTo}/>}
          {opStep===5&&<WizStep5 opData={opData} setOpStep={setOpStep} crearOperacion={crearOperacion} getCliente={getCliente} getCuenta={getCuenta}/>}
        </div>
      </div>
    )
  }

  function Operaciones() {
    const filtered = operaciones.filter(o=>filtroOps==='todas'||o.estado===filtroOps)
    return (
      <div>
        <div style={S.sectionHeader}><div style={S.h2}>Operaciones</div></div>
        <div style={S.filterBar}>
          {['todas','activa','concretada','cancelada'].map(f=>(
            <button key={f} style={S.chip(filtroOps===f)} onClick={()=>setFiltroOps(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
        {filtered.length===0
          ?<div style={S.empty}>Sin operaciones{filtroOps!=='todas'?' con estado '+filtroOps:''}</div>
          :[...filtered].reverse().map(o=>{
            const pnl=calcPnL(o)
            const pnlSign=pnl.monto>=0?'+':''
            return (
              <div key={o.id} style={{...S.opRow,cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{flex:1,cursor:'pointer'}} onClick={()=>setModal({type:'verOp',id:o.id})}>
                  <div style={{fontSize:'13px',fontWeight:'500'}}>{getCliente(o.clienteId)?.nombre||'?'} — <TypeBadge tipo={o.tipo}/></div>
                  <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>{fmt(o.entrada.monto,2)} {o.entrada.moneda} → {fmt(o.salida.monto,2)} {o.salida.moneda} · {o.fecha}</div>
                </div>
                <div style={{textAlign:'right',marginRight:'8px'}}>
                  <div style={{fontSize:'12px',fontWeight:'600',color:pnl.monto>=0?'var(--green)':'var(--red)'}}>{pnlSign}{fmt(pnl.monto,4)} {pnl.moneda}</div>
                </div>
                <Tag estado={o.estado}/>
                <div style={{display:'flex',gap:'6px'}}>
                  {o.estado==='activa'&&<><Btn sm variant="primary" onClick={()=>confirmarPago(o.id)}>Confirmar pago</Btn><Btn sm variant="danger" onClick={()=>cancelarOp(o.id)}>Cancelar</Btn></>}
                  {o.estado==='concretada'&&<Btn sm onClick={()=>generarInvoice(o,getCliente(o.clienteId),getCuenta(o.cuentaEntradaId||o.cuentaId))}>Invoice</Btn>}
                </div>
              </div>
            )
          })
        }
      </div>
    )
  }

  function Clientes() {
    return (
      <div>
        <div style={S.sectionHeader}><div style={S.h2}>Clientes</div><Btn variant="primary" onClick={()=>setModal({type:'nuevoCliente'})}>+ Nuevo cliente</Btn></div>
        {clientes.length===0?<div style={S.empty}>Sin clientes registrados</div>:clientes.map(c=>(
          <div key={c.id} style={{...S.opRow,cursor:'default'}}>
            <div style={S.avatar}>{initials(c.nombre)}</div>
            <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'500'}}>{c.nombre}{c.alias&&<span style={{fontSize:'11px',color:'var(--text2)'}}> ({c.alias})</span>}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{[c.nacionalidad,c.email,c.telefono,c.telegram,c.documento].filter(Boolean).join(' · ')}</div></div>
            <Btn sm onClick={()=>setModal({type:'editarCliente',cliente:c})}>Editar</Btn>
          </div>
        ))}
      </div>
    )
  }

  function Cuentas() {
    return (
      <div>
        <div style={S.sectionHeader}><div style={S.h2}>Cuentas</div><Btn variant="primary" onClick={()=>setModal({type:'nuevaCuenta'})}>+ Nueva cuenta</Btn></div>
        {cuentas.map(c=>(
          <div key={c.id} style={S.card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <div><span style={{fontSize:'14px',fontWeight:'500'}}>{c.nombre}</span><span style={{fontSize:'11px',color:'var(--text2)',marginLeft:'8px'}}>{c.tipo} · {c.moneda}</span></div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <span style={{fontSize:'15px',fontWeight:'600',color:(parseFloat(c.saldo)||0)>=0?'var(--green)':'var(--red)'}}>{fmt(parseFloat(c.saldo)||0,2)} {c.moneda}</span>
                <Btn sm onClick={()=>setModal({type:'editarCuenta',cuenta:c})}>Editar</Btn>
              </div>
            </div>
            {c.tipo==='crypto'?<><div style={{fontSize:'12px',color:'var(--text2)'}}>Red: {c.red}</div><div style={{...S.mono,color:'var(--text2)',marginTop:'4px'}}>{c.direccion}</div></>:<div style={{fontSize:'12px',color:'var(--text2)'}}>Cuenta: {c.numero} · Agencia: {c.agencia}</div>}
            {c.descripcion&&<div style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>{c.descripcion}</div>}
          </div>
        ))}
      </div>
    )
  }

  function Configuraciones() {
    const [adding,setAdding]=useState(null)
    const [newVal,setNewVal]=useState('')
    const [editing,setEditing]=useState(null)
    function persist(cat,next){if(cat==='tipo'){setTiposExtra(next);storage.set('opt_tipos',next)}if(cat==='moneda'){setMonedasExtra(next);storage.set('opt_monedas',next)}if(cat==='red'){setRedesExtra(next);storage.set('opt_redes',next)}}
    function getExtra(cat){return cat==='tipo'?tiposExtra:cat==='moneda'?monedasExtra:redesExtra}
    function addItem(cat){const v=newVal.trim();if(!v)return;persist(cat,[...getExtra(cat),v]);setNewVal('');setAdding(null)}
    function deleteItem(cat,val){if(!window.confirm(`¿Eliminar "${val}"?`))return;persist(cat,getExtra(cat).filter(x=>x!==val))}
    function saveEdit(){if(!editing)return;persist(editing.cat,getExtra(editing.cat).map(x=>x===editing.val?editing.draft.trim():x));setEditing(null)}
    function Section({title,cat,base,addPlaceholder}){
      const extra=getExtra(cat)
      return (
        <div style={S.card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
            <div><div style={{fontSize:'14px',fontWeight:'500'}}>{title}</div><div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>{base.length+extra.length} valores</div></div>
            <Btn sm variant="primary" onClick={()=>{setAdding(cat);setNewVal('')}}>+ Agregar</Btn>
          </div>
          <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'6px',fontWeight:'500',letterSpacing:'0.3px'}}>PREDETERMINADOS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>{base.map(item=><div key={item} style={{padding:'4px 12px',borderRadius:'20px',background:'var(--bg3)',border:'0.5px solid var(--border)',fontSize:'12px',color:'var(--text3)'}}>{item}</div>)}</div>
          <hr style={S.divider}/>
          <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'6px',fontWeight:'500',letterSpacing:'0.3px'}}>PERSONALIZADOS</div>
          {extra.length===0&&adding!==cat&&<div style={{fontSize:'12px',color:'var(--text3)',padding:'6px 0'}}>Sin valores personalizados aún.</div>}
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {extra.map(item=>(
              <div key={item} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',borderRadius:'var(--radius)',border:'0.5px solid var(--border)',background:'var(--bg3)'}}>
                {editing?.cat===cat&&editing?.val===item?<><input autoFocus value={editing.draft} onChange={e=>setEditing(p=>({...p,draft:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditing(null)}} style={{flex:1,padding:'4px 8px',fontSize:'12px'}}/><Btn sm variant="primary" onClick={saveEdit}>Guardar</Btn><Btn sm onClick={()=>setEditing(null)}>Cancelar</Btn></>:<><span style={{flex:1,fontSize:'13px'}}>{item}</span><Btn sm onClick={()=>setEditing({cat,val:item,draft:item})}>Editar</Btn><Btn sm variant="danger" onClick={()=>deleteItem(cat,item)}>Eliminar</Btn></>}
              </div>
            ))}
          </div>
          {adding===cat&&<div style={{display:'flex',gap:'6px',marginTop:'8px'}}><input autoFocus value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addItem(cat);if(e.key==='Escape')setAdding(null)}} placeholder={addPlaceholder} style={{flex:1}}/><Btn sm variant="primary" onClick={()=>addItem(cat)}>Agregar</Btn><Btn sm onClick={()=>setAdding(null)}>Cancelar</Btn></div>}
        </div>
      )
    }
    return (
      <div>
        <div style={{...S.h2,marginBottom:'6px'}}>Configuraciones</div>
        <div style={{fontSize:'13px',color:'var(--text2)',marginBottom:'20px'}}>Administrá los catálogos usados en el formulario de cuentas.</div>
        <Section title="Tipos de cuenta" cat="tipo" base={TIPOS_BASE} addPlaceholder="Ej: PayPal, Wise..."/>
        <Section title="Monedas" cat="moneda" base={MONEDAS_BASE} addPlaceholder="Ej: GBP, USDC, CLP..."/>
        <Section title="Redes crypto" cat="red" base={REDES_BASE} addPlaceholder="Ej: ARBITRUM, AVALANCHE..."/>
      </div>
    )
  }

  // ════════════════════ MODALS ════════════════════════════════════════════════

  function VerOpModal({id}) {
    const op = operaciones.find(o=>o.id===id)
    if(!op) return null
    const cliente = getCliente(op.clienteId)
    const cEnt  = getCuenta(op.cuentaEntradaId||op.cuentaId)
    const cSal  = getCuenta(op.cuentaSalidaId)
    const fileRef = useRef()
    const pnl = calcPnL(op)
    const pnlSign = pnl.monto>=0?'+':''
    const comPct = parseFloat(op.comisionPct)||0
    const montoSal = parseFloat(op.salida.monto)||0
    const comMonto = parseFloat(op.comisionMonto)||0
    const netoCliente = montoSal - (comPct>=0?comMonto:-comMonto)
    return (
      <div style={S.modalBg} onClick={()=>setModal(null)}>
        <div style={S.modalWide} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
            <div style={{fontSize:'15px',fontWeight:'600',flex:1}}>Operación {op.ref}</div>
            <Tag estado={op.estado}/>
          </div>
          {/* P&L highlight */}
          <div style={{background:pnl.monto>=0?'var(--green-dim)':'var(--red-dim)',border:`0.5px solid ${pnl.monto>=0?'var(--green-border)':'rgba(255,90,90,0.3)'}`,borderRadius:'var(--radius)',padding:'10px 14px',marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:pnl.monto>=0?'var(--green)':'var(--red)'}}>Ganancia / Pérdida</span>
            <span style={{fontSize:'18px',fontWeight:'700',color:pnl.monto>=0?'var(--green)':'var(--red)'}}>{pnlSign}{fmt(pnl.monto,4)} {pnl.moneda}</span>
          </div>

          <div style={S.row2}><InfoBox label="Cliente" value={cliente?.nombre}/><InfoBox label="Tipo" value={op.tipo}/></div>
          <div style={S.row3}>
            <InfoBox label="Entrada" value={`${fmt(op.entrada.monto,2)} ${op.entrada.moneda}`}/>
            <InfoBox label="Salida" value={`${fmt(op.salida.monto,2)} ${op.salida.moneda}`}/>
            <InfoBox label="Neto cliente" value={`${fmt(netoCliente,4)} ${op.salida.moneda}`}/>
          </div>
          {op.referencia&&<InfoBox label="Referencia" value={op.referencia}/>}
          {cEnt&&<div style={S.accountBox}><div style={{fontSize:'12px',fontWeight:'500',color:'var(--green)',marginBottom:'6px'}}>Cuenta entrada — {cEnt.nombre}</div>{cEnt.tipo==='crypto'?<><div style={{fontSize:'11px',color:'var(--green)',opacity:.7}}>Red: {cEnt.red}</div><div style={{...S.mono,color:'var(--green)',marginTop:'4px'}}>{cEnt.direccion}</div></>:<div style={{fontSize:'12px',color:'var(--green)',opacity:.8}}>Cuenta: {cEnt.numero} · Agencia: {cEnt.agencia}</div>}</div>}
          {cSal&&<div style={{...S.accountBox,background:'var(--amber-dim)',border:'0.5px solid rgba(245,166,35,0.3)'}}><div style={{fontSize:'12px',fontWeight:'500',color:'var(--amber)',marginBottom:'4px'}}>Cuenta salida — {cSal.nombre}</div><div style={{fontSize:'12px',color:'var(--amber)',opacity:.8}}>{cSal.moneda}</div></div>}

          {/* Comprobantes */}
          <div style={{marginTop:'12px'}}>
            <div style={{fontSize:'12px',fontWeight:'500',color:'var(--text2)',marginBottom:'8px'}}>Comprobantes</div>
            {(op.comprobantes||[]).length===0&&<div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'8px'}}>Sin comprobantes.</div>}
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
              {(op.comprobantes||[]).map((f,i)=>(
                <div key={i} style={{position:'relative',border:'0.5px solid var(--border2)',borderRadius:'var(--radius)',overflow:'hidden',width:'80px',height:'80px',background:'var(--bg3)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {f.type.startsWith('image/')?<img src={f.data} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover',cursor:'pointer'}} onClick={()=>window.open(f.data,'_blank')}/>:<div style={{textAlign:'center',padding:'8px',cursor:'pointer'}} onClick={()=>window.open(f.data,'_blank')}><div style={{fontSize:'20px'}}>📄</div><div style={{fontSize:'9px',color:'var(--text2)',marginTop:'4px',wordBreak:'break-all',lineHeight:1.2}}>{f.name.slice(0,16)}</div></div>}
                  <button onClick={()=>removeComprobante(id,i)} style={{position:'absolute',top:'2px',right:'2px',width:'16px',height:'16px',borderRadius:'50%',background:'rgba(0,0,0,.7)',border:'none',color:'#fff',fontSize:'10px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{display:'none'}} onChange={e=>{addComprobante(id,e.target.files);e.target.value=''}}/>
            <Btn sm onClick={()=>fileRef.current.click()}>+ Adjuntar comprobante</Btn>
          </div>

          <div style={{display:'flex',gap:'8px',marginTop:'16px',flexWrap:'wrap'}}>
            {op.estado==='activa'&&<><Btn variant="primary" onClick={()=>confirmarPago(op.id)}>Confirmar pago</Btn><Btn variant="danger" onClick={()=>cancelarOp(op.id)}>Cancelar operación</Btn></>}
            {op.estado==='concretada'&&<Btn onClick={()=>generarInvoice(op,cliente,cEnt)}>Ver invoice</Btn>}
            <Btn onClick={()=>setModal(null)}>Cerrar</Btn>
          </div>
        </div>
      </div>
    )
  }

  function ClienteModal({cliente,preNombre,onSave}) {
    const editing=!!cliente
    const [form,setForm]=useState(cliente||{nombre:preNombre||'',alias:'',nacionalidad:'',email:'',telefono:'',telegram:'',documento:''})
    const upd=(k,v)=>setForm(p=>({...p,[k]:v}))
    function submit(){if(!form.nombre.trim()){alert('El nombre es requerido');return}const id=saveCliente({...form,id:cliente?.id});setModal(null);if(onSave)onSave(id||cliente?.id)}
    return (
      <div style={S.modalBg} onClick={()=>setModal(null)}>
        <div style={S.modal} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'16px'}}>{editing?'Editar':'Nuevo'} cliente</div>
          <div style={S.row1}><label style={S.lbl}>Nombre completo *</label><input value={form.nombre} onChange={e=>upd('nombre',e.target.value)} placeholder="Juan Pérez"/></div>
          <div style={S.row2}>
            <div><label style={S.lbl}>Alias</label><input value={form.alias||''} onChange={e=>upd('alias',e.target.value)} placeholder="juanp"/></div>
            <div><label style={S.lbl}>Nacionalidad</label><select value={form.nacionalidad||''} onChange={e=>upd('nacionalidad',e.target.value)}><option value="">— Seleccionar —</option>{NACIONALIDADES.map(n=><option key={n} value={n}>{n}</option>)}</select></div>
          </div>
          <div style={S.row2}>
            <div><label style={S.lbl}>Email (opcional)</label><input type="email" value={form.email||''} onChange={e=>upd('email',e.target.value)} placeholder="juan@email.com"/></div>
            <div><label style={S.lbl}>Teléfono (opcional)</label><input value={form.telefono||''} onChange={e=>upd('telefono',e.target.value)} placeholder="+595 9XX..."/></div>
          </div>
          <div style={S.row2}>
            <div><label style={S.lbl}>Telegram (opcional)</label><input value={form.telegram||''} onChange={e=>upd('telegram',e.target.value)} placeholder="@usuario"/></div>
            <div><label style={S.lbl}>Pasaporte / DNI (opcional)</label><input value={form.documento||''} onChange={e=>upd('documento',e.target.value)} placeholder="12345678"/></div>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'16px',justifyContent:'flex-end'}}>
            {editing&&<Btn variant="danger" onClick={()=>{if(window.confirm('¿Eliminar cliente?')){deleteCliente(cliente.id);setModal(null)}}}>Eliminar</Btn>}
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={submit}>Guardar</Btn>
          </div>
        </div>
      </div>
    )
  }

  function CuentaModal({cuenta}) {
    const editing=!!cuenta
    const [tiposEx,setTiposEx]=useState(()=>storage.get('opt_tipos')||[])
    const [monedasEx,setMonedasEx]=useState(()=>storage.get('opt_monedas')||[])
    const [redesEx,setRedesEx]=useState(()=>storage.get('opt_redes')||[])
    const tOpts=[...TIPOS_BASE,...tiposEx],mOpts=[...MONEDAS_BASE,...monedasEx],rOpts=[...REDES_BASE,...redesEx]
    const [form,setForm]=useState(cuenta||{nombre:'',tipo:'crypto',moneda:'',red:'',direccion:'',numero:'',agencia:'',descripcion:'',saldo:'0'})
    const upd=(k,v)=>setForm(p=>({...p,[k]:v}))
    const addT=v=>{const n=[...tiposEx,v];setTiposEx(n);storage.set('opt_tipos',n)}
    const addM=v=>{const n=[...monedasEx,v];setMonedasEx(n);storage.set('opt_monedas',n)}
    const addR=v=>{const n=[...redesEx,v];setRedesEx(n);storage.set('opt_redes',n)}
    function submit(){if(!form.nombre.trim()){alert('El nombre es requerido');return}saveCuenta({...form,id:cuenta?.id,saldo:parseFloat(form.saldo)||0});setModal(null)}
    return (
      <div style={S.modalBg} onClick={()=>setModal(null)}>
        <div style={S.modal} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'16px'}}>{editing?'Editar':'Nueva'} cuenta</div>
          <div style={S.row1}><label style={S.lbl}>Nombre de la cuenta</label><input value={form.nombre} onChange={e=>upd('nombre',e.target.value)} placeholder="Binance Pay, Banco Itaú..."/></div>
          <div style={S.row2}>
            <ComboSelect label="Tipo" value={form.tipo} options={tOpts} onChange={v=>upd('tipo',v)} onAddCustom={addT} placeholder="Ej: PayPal, Wise..."/>
            <ComboSelect label="Moneda" value={form.moneda} options={mOpts} onChange={v=>upd('moneda',v)} onAddCustom={addM} placeholder="Ej: GBP, USDC..."/>
          </div>
          {form.tipo==='crypto'&&<><div style={{...S.row1,marginBottom:'12px'}}><ComboSelect label="Red" value={form.red} options={rOpts} onChange={v=>upd('red',v)} onAddCustom={addR} placeholder="Ej: ARBITRUM..."/></div><div style={S.row1}><label style={S.lbl}>Dirección / Wallet</label><input value={form.direccion} onChange={e=>upd('direccion',e.target.value)} placeholder="0x..."/></div></>}
          {form.tipo!=='crypto'&&form.tipo!=='efectivo'&&<div style={S.row2}><div><label style={S.lbl}>Número de cuenta</label><input value={form.numero||''} onChange={e=>upd('numero',e.target.value)} placeholder="12345-6"/></div><div><label style={S.lbl}>Agencia / CBU / CVU</label><input value={form.agencia||''} onChange={e=>upd('agencia',e.target.value)} placeholder="0001"/></div></div>}
          <div style={S.row2}>
            <div><label style={S.lbl}>Saldo inicial</label><input type="number" value={form.saldo} onChange={e=>upd('saldo',e.target.value)} placeholder="0"/></div>
            <div><label style={S.lbl}>Descripción (opcional)</label><input value={form.descripcion||''} onChange={e=>upd('descripcion',e.target.value)} placeholder="Cuenta principal..."/></div>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'16px',justifyContent:'flex-end'}}>
            {editing&&<Btn variant="danger" onClick={()=>{if(window.confirm('¿Eliminar cuenta?')){deleteCuenta(cuenta.id);setModal(null)}}}>Eliminar</Btn>}
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn variant="primary" onClick={submit}>Guardar</Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── Nav + render ──────────────────────────────────────────────────────────
  const navItems=[
    {id:'dashboard',label:'Dashboard'},{id:'nueva',label:'Nueva operación'},
    {id:'operaciones',label:'Operaciones'},{id:'clientes',label:'Clientes'},
    {id:'cuentas',label:'Cuentas'},{id:'configuraciones',label:'Configuraciones'},
  ]

  return (
    <div style={S.app}>
      <div style={S.topbar}>
        <div style={S.brand}>Crypto<span style={S.brandAccent}>Desk</span></div>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>navTo(n.id)} style={{padding:'6px 12px',borderRadius:'var(--radius)',border:'0.5px solid transparent',background:view===n.id?'var(--bg3)':'transparent',color:view===n.id?'var(--text)':'var(--text2)',fontSize:'13px',fontWeight:view===n.id?'500':'400',borderColor:view===n.id?'var(--border2)':'transparent',flexShrink:0,cursor:'pointer'}}>
            {n.label}
          </button>
        ))}
      </div>
      <div style={S.main}>
        {view==='dashboard'       &&<Dashboard/>}
        {view==='nueva'           &&<NuevaOp/>}
        {view==='operaciones'     &&<Operaciones/>}
        {view==='clientes'        &&<Clientes/>}
        {view==='cuentas'         &&<Cuentas/>}
        {view==='configuraciones' &&<Configuraciones/>}
      </div>
      {modal?.type==='verOp'                                         &&<VerOpModal id={modal.id}/>}
      {(modal?.type==='nuevoCliente'||modal?.type==='editarCliente') &&<ClienteModal cliente={modal.cliente} preNombre={modal.preNombre} onSave={modal.onSave}/>}
      {(modal?.type==='nuevaCuenta'||modal?.type==='editarCuenta')   &&<CuentaModal cuenta={modal.cuenta}/>}
    </div>
  )
}
