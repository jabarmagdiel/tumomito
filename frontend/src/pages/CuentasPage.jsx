import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CuentasPage() {
  const [tab, setTab] = useState('cobrar');
  const [cobrar, setCobrar] = useState([]);
  const [pagar, setPagar] = useState([]);
  const [monto, setMonto] = useState({});

  useEffect(() => {
    api.get('/api/cuentas/cobrar').then(r => setCobrar(r.data));
    api.get('/api/cuentas/pagar').then(r => setPagar(r.data));
  }, []);

  const pagarCobrar = async (id) => {
    if (!monto[`c${id}`]) return toast.error('Ingrese monto');
    await api.post(`/api/cuentas/cobrar/${id}/pago`, { monto: parseFloat(monto[`c${id}`]) });
    toast.success('Pago registrado');
    api.get('/api/cuentas/cobrar').then(r => setCobrar(r.data));
  };

  const pagarPagar = async (id) => {
    if (!monto[`p${id}`]) return toast.error('Ingrese monto');
    await api.post(`/api/cuentas/pagar/${id}/pago`, { monto: parseFloat(monto[`p${id}`]) });
    toast.success('Pago registrado');
    api.get('/api/cuentas/pagar').then(r => setPagar(r.data));
  };

  const fmt = n => `Bs. ${Number(n).toFixed(2)}`;

  const totalCobrar = cobrar.reduce((s, c) => s + c.saldo, 0);
  const totalPagar = pagar.reduce((s, c) => s + c.saldo, 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2 className="page-title">Cuentas</h2><p className="page-subtitle">Control de cobros y pagos pendientes</p></div>
      </div>

      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi-card">
          <div className="kpi-icon green">💰</div>
          <div className="kpi-label">Por Cobrar</div>
          <div className="kpi-value" style={{fontSize:22,color:'var(--success)'}}>{fmt(totalCobrar)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red">💸</div>
          <div className="kpi-label">Por Pagar</div>
          <div className="kpi-value" style={{fontSize:22,color:'var(--danger)'}}>{fmt(totalPagar)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={`btn btn-sm ${tab==='cobrar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('cobrar')}>Cuentas por Cobrar ({cobrar.length})</button>
        <button className={`btn btn-sm ${tab==='pagar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pagar')}>Cuentas por Pagar ({pagar.length})</button>
      </div>

      {tab === 'cobrar' && (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Venta ID</th><th>Cliente</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Vence</th><th>Estado</th><th>Registrar Pago</th></tr></thead>
            <tbody>
              {cobrar.map(c => (
                <tr key={c.id}>
                  <td style={{fontFamily:'monospace',color:'var(--primary-light)'}}>#VTA-{c.venta_id}</td>
                  <td>{c.cliente_nombre}</td>
                  <td>{fmt(c.monto_total)}</td>
                  <td>{fmt(c.monto_pagado)}</td>
                  <td style={{fontWeight:700,color:'var(--success)'}}>{fmt(c.saldo)}</td>
                  <td style={{fontSize:12,color:'var(--text-muted)'}}>{c.fecha_vencimiento || '—'}</td>
                  <td><span className={`badge ${c.estado==='PENDIENTE' ? 'badge-warning' : 'badge-info'}`}>{c.estado}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <input type="number" step="0.01" className="form-control" style={{width:100}} placeholder="Monto" value={monto[`c${c.id}`]||''} onChange={e => setMonto({...monto, [`c${c.id}`]: e.target.value})}/>
                      <button className="btn btn-success btn-sm" onClick={() => pagarCobrar(c.id)}>✓</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pagar' && (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Compra ID</th><th>Proveedor</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Vence</th><th>Estado</th><th>Registrar Pago</th></tr></thead>
            <tbody>
              {pagar.map(c => (
                <tr key={c.id}>
                  <td style={{fontFamily:'monospace',color:'var(--primary-light)'}}>#OC-{c.compra_id}</td>
                  <td>{c.proveedor_nombre}</td>
                  <td>{fmt(c.monto_total)}</td>
                  <td>{fmt(c.monto_pagado)}</td>
                  <td style={{fontWeight:700,color:'var(--danger)'}}>{fmt(c.saldo)}</td>
                  <td style={{fontSize:12,color:'var(--text-muted)'}}>{c.fecha_vencimiento || '—'}</td>
                  <td><span className={`badge ${c.estado==='PENDIENTE' ? 'badge-warning' : 'badge-info'}`}>{c.estado}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <input type="number" step="0.01" className="form-control" style={{width:100}} placeholder="Monto" value={monto[`p${c.id}`]||''} onChange={e => setMonto({...monto, [`p${c.id}`]: e.target.value})}/>
                      <button className="btn btn-success btn-sm" onClick={() => pagarPagar(c.id)}>✓</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
