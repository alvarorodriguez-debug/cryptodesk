export const storage = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
}

export const DEFAULT_CUENTAS = [
  { id: 'c1', nombre: 'Binance Pay', tipo: 'crypto', moneda: 'USDT', red: 'BEP20', direccion: '0xA1B2C3D4E5F6...abcd', descripcion: 'Cuenta principal USDT' },
  { id: 'c2', nombre: 'Banco Itaú', tipo: 'banco', moneda: 'BRL', numero: '12345-6', agencia: '0001', descripcion: 'Conta corrente BRL' },
]

export function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
}

export function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('es-PY') : ''
}

export function genRef() {
  return 'OP-' + Date.now().toString().slice(-6)
}
