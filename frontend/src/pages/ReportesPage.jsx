import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

export default function ReportesPage() {
  const [tab, setTab] = useState('top');
  const [topProductos, setTopProductos] = useState([]);
  const [sinRotacion, setSinRotacion] = useState([]);
  const [ventasFecha, setVentasFecha] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [fi, setFi] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10));
  const [ff, setFf] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAll(); }, [fi, ff]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [t, s, v, i] = await Promise.all([
        api.get(`/api/reportes/productos-mas-vendidos?fecha_inicio=${fi}&fecha_fin=${ff}&limit=10`),
        api.get('/api/reportes/productos-sin-rotacion?dias=60'),
        api.get(`/api/reportes/ventas-por-fecha?fecha_inicio=${fi}&fecha_fin=${ff}`),
        api.get('/api/reportes/inventario-actual'),
      ]);
      setTopProductos(t.data);
      setSinRotacion(s.data);
      setVentasFecha(v.data);
      setInventario(i.data.slice(0,20));
    } finally { setLoading(false); }
  };

  const fmt = (n) => `Bs. ${Number(n).toFixed(2)}`;
  const tabs = ['top','sinrotacion','ventas','inventario'];
  const tabLabels = ['🏆 Más Vendidos','📦 Sin Rotación','📈 Ventas/Fecha','🗂 Inventario'];

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2 className="page-title">Reportes</h2><p className="page-subtitle">Análisis estratégico de la operación</p></div>
        <div className="flex gap-2 items-center">
          <input type="date" className="form-control" style={{width:160}} value={fi} onChange={e => setFi(e.target.value)}/>
          <span className="text-muted">—</span>
          <input type="date" className="form-control" style={{width:160}} value={ff} onChange={e => setFf(e.target.value)}/>
        </div>
      </div>

      <div className="flex gap-2 mb-4" style={{flexWrap:'wrap'}}>
        {tabs.map((t, i) => (
          <button key={t} className={`btn ${tab===t ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab(t)}>{tabLabels[i]}</button>
        ))}
      </div>

      {loading && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Cargando reporte...</div>}

      {!loading && tab === 'top' && (
        <div className="charts-grid">
          <div className="card">
            <h3 className="section-title">Top 10 Productos Más Vendidos (Cantidad)</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false}/>
                  <XAxis type="number" tick={{fill:'#64748b',fontSize:11}}/>
                  <YAxis dataKey="nombre" type="category" width={150} tick={{fill:'#94a3b8',fontSize:10}} tickFormatter={v => v.length>20 ? v.slice(0,20)+'…' : v}/>
                  <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8}} formatter={(v,n) => [v, 'Unidades']}/>
                  <Bar dataKey="total_vendido" fill="#6366f1" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">Ingresos por Producto (Bs.)</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topProductos} dataKey="total_ingreso" nameKey="nombre" cx="50%" cy="50%" outerRadius={100} label={({nombre, percent}) => `${nombre?.slice(0,12)} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {topProductos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8}} formatter={(v) => [fmt(v), 'Ingreso']}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'sinrotacion' && (
        <div className="card">
          <h3 className="section-title">Productos sin Rotación (últimos 60 días) — {sinRotacion.length} productos</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Stock Actual</th></tr></thead>
              <tbody>
                {sinRotacion.map(p => (
                  <tr key={p.id}>
                    <td style={{fontFamily:'monospace',color:'var(--primary-light)'}}>{p.codigo_interno}</td>
                    <td>{p.nombre}</td>
                    <td><span className={`badge ${p.stock_total > 0 ? 'badge-warning' : 'badge-gray'}`}>{p.stock_total}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'ventas' && (
        <div className="card">
          <h3 className="section-title">Ventas por Fecha</h3>
          <div className="chart-container" style={{height:350}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasFecha}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)"/>
                <XAxis dataKey="fecha" tick={{fill:'#64748b',fontSize:11}} tickFormatter={d => d.slice(5)}/>
                <YAxis tick={{fill:'#64748b',fontSize:11}}/>
                <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8}} formatter={(v) => [fmt(v), 'Total Ventas']}/>
                <Bar dataKey="total" fill="#f59e0b" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && tab === 'inventario' && (
        <div className="card">
          <h3 className="section-title">Inventario Actual (Top 20 por valor)</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Stock</th><th>P. Mayorista</th><th>P. Costo</th><th>Valor Inventario</th></tr></thead>
              <tbody>
                {inventario.sort((a,b) => b.valor_inventario - a.valor_inventario).map(p => (
                  <tr key={p.id}>
                    <td style={{fontFamily:'monospace',fontSize:12,color:'var(--primary-light)'}}>{p.codigo_interno}</td>
                    <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</td>
                    <td><span className="badge badge-info">{p.stock_total}</span></td>
                    <td>{fmt(p.precio_mayorista)}</td>
                    <td>{fmt(p.precio_costo)}</td>
                    <td style={{fontWeight:700,color:'var(--success)'}}>{fmt(p.valor_inventario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
