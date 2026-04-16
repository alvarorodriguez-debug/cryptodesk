export function generarInvoice(op, cliente, cuenta) {
  const w = window.open('', '_blank', 'width=620,height=750')
  const montoNeto = (parseFloat(op.entrada.monto) - (op.comisionMonto || 0)).toFixed(2)
  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Invoice ${op.ref}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111; padding: 48px; max-width: 560px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand { font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }
  .brand span { color: #1fd98a; }
  .ref { font-size: 12px; color: #666; margin-top: 4px; font-family: 'DM Mono', monospace; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: #e6faf2; color: #0a7a4a; }
  .badge.venta { background: #fff4e0; color: #8a5700; }
  .badge.transferencia { background: #efe9ff; color: #5b3db5; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #999; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 0.5px solid #f0f0f0; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #666; }
  .row .val { font-weight: 500; }
  .total-box { background: #f8f8f8; border-radius: 10px; padding: 16px; margin-top: 20px; }
  .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
  .total-row.main { font-size: 16px; font-weight: 600; padding-top: 12px; margin-top: 8px; border-top: 1.5px solid #ddd; }
  .addr { font-family: 'DM Mono', monospace; font-size: 11px; word-break: break-all; color: #333; background: #f5f5f5; padding: 8px 10px; border-radius: 6px; margin-top: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 0.5px solid #eee; font-size: 11px; color: #bbb; display: flex; justify-content: space-between; }
  .print-btn { display: block; margin: 32px auto 0; padding: 10px 24px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-family: inherit; cursor: pointer; }
  @media print { .print-btn { display: none; } body { padding: 24px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">Crypto<span>Desk</span></div>
    <div class="ref">${op.ref}</div>
  </div>
  <div style="text-align:right">
    <span class="badge ${op.tipo}">${op.tipo.toUpperCase()}</span>
    <div style="font-size:12px;color:#999;margin-top:6px">${op.fechaPago || op.fecha}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Cliente</div>
  <div class="row"><span class="label">Nombre</span><span class="val">${cliente?.nombre || '—'}</span></div>
  ${cliente?.alias ? `<div class="row"><span class="label">Alias</span><span class="val">${cliente.alias}</span></div>` : ''}
  ${cliente?.contacto ? `<div class="row"><span class="label">Contacto</span><span class="val">${cliente.contacto}</span></div>` : ''}
</div>

<div class="section">
  <div class="section-title">Operación</div>
  <div class="row"><span class="label">Tipo</span><span class="val">${op.tipo}</span></div>
  <div class="row"><span class="label">Moneda entrada</span><span class="val">${op.entrada.moneda}</span></div>
  <div class="row"><span class="label">Moneda salida</span><span class="val">${op.salida.moneda}</span></div>
  <div class="row"><span class="label">Cotización</span><span class="val">${op.cotizacion}</span></div>
</div>

<div class="total-box">
  <div class="total-row"><span>Monto entrada</span><span>${op.entrada.monto} ${op.entrada.moneda}</span></div>
  <div class="total-row"><span>Monto salida</span><span>${op.salida.monto} ${op.salida.moneda}</span></div>
  <div class="total-row"><span>Comisión (${op.comisionPct}%)</span><span>${(op.comisionMonto || 0).toFixed(2)} ${op.entrada.moneda}</span></div>
  <div class="total-row main"><span>Total neto cliente</span><span>${montoNeto} ${op.entrada.moneda}</span></div>
</div>

${cuenta ? `
<div class="section" style="margin-top:24px">
  <div class="section-title">Cuenta de pago</div>
  <div class="row"><span class="label">Cuenta</span><span class="val">${cuenta.nombre}</span></div>
  ${cuenta.tipo === 'crypto'
    ? `<div class="row"><span class="label">Red</span><span class="val">${cuenta.red || ''}</span></div>
       <div style="margin-top:8px"><div style="font-size:11px;color:#999;margin-bottom:4px">Dirección</div><div class="addr">${cuenta.direccion || ''}</div></div>`
    : `<div class="row"><span class="label">Nro. cuenta</span><span class="val">${cuenta.numero || ''}</span></div>
       <div class="row"><span class="label">Agencia</span><span class="val">${cuenta.agencia || ''}</span></div>`
  }
</div>` : ''}

<div class="footer">
  <span>CryptoDesk · ${new Date().getFullYear()}</span>
  <span>${op.ref}</span>
</div>

<button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
</body>
</html>`)
  w.document.close()
}
