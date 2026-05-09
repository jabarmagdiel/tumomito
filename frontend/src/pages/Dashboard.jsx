import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { ShoppingCart, Package, AlertTriangle, TrendingUp, DollarSign, BarChart3, Loader } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasFecha, setVentasFecha] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/reportes/dashboard'),
      api.get('/api/reportes/productos-mas-vendidos?limit=8'),
      api.get('/api/reportes/ventas-por-fecha'),
    ]).then(([kRes, tRes, vRes]) => {
      setKpis(kRes.data);
      setTopProductos(tRes.data);
      setVentasFecha(vRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-body" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'80vh'}}>
      <Loader className="spin" size={40} color="var(--primary-light)" />
    </div>
  );

  const fmt = (n) => `Bs. ${Number(n).toLocaleString('es-BO', {minimumFractionDigits:2})}`;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Resumen ejecutivo de operaciones TUMOMITO</p>
        </div>
      </div>

      {kpis?.alertas_stock > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} />
          <strong>{kpis.alertas_stock} productos</strong> con stock por debajo del mínimo
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon indigo"><DollarSign size={20} /></div>
          <div className="kpi-label">Ventas Hoy</div>
          <div className="kpi-value" style={{fontSize:22}}>{fmt(kpis?.ventas_hoy)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><TrendingUp size={20} /></div>
          <div className="kpi-label">Ventas Esta Semana</div>
          <div className="kpi-value" style={{fontSize:22}}>{fmt(kpis?.ventas_semana)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon amber"><BarChart3 size={20} /></div>
          <div className="kpi-label">Ventas Este Mes</div>
          <div className="kpi-value" style={{fontSize:22}}>{fmt(kpis?.ventas_mes)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon indigo"><ShoppingCart size={20} /></div>
          <div className="kpi-label">Transacciones Mes</div>
          <div className="kpi-value">{kpis?.num_ventas_mes}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><Package size={20} /></div>
          <div className="kpi-label">Total Productos</div>
          <div className="kpi-value">{kpis?.total_productos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><AlertTriangle size={20} /></div>
          <div className="kpi-label">Alertas Stock</div>
          <div className="kpi-value" style={{color: kpis?.alertas_stock > 0 ? 'var(--danger)' : 'var(--success)'}}>
            {kpis?.alertas_stock}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 className="section-title">Ventas por Día (Mes Actual)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasFecha}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="fecha" tick={{fill:'#64748b', fontSize:11}} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{fill:'#64748b', fontSize:11}} />
                <Tooltip
                  contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8}}
                  labelStyle={{color:'#e2e8f0'}}
                  formatter={(v) => [`Bs. ${v.toFixed(2)}`, 'Total']}
                />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{fill:'#6366f1'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Top Productos Más Vendidos</h3>
          {topProductos.length === 0 ? (
            <div className="empty-state"><Package /><p>Sin datos de ventas aún</p></div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{fill:'#64748b', fontSize:11}} />
                  <YAxis dataKey="nombre" type="category" width={120} tick={{fill:'#94a3b8', fontSize:10}} tickFormatter={v => v.length > 18 ? v.slice(0,18)+'…' : v} />
                  <Tooltip
                    contentStyle={{background:'#1a1a2e',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8}}
                    formatter={(v) => [v, 'Unidades vendidas']}
                  />
                  <Bar dataKey="total_vendido" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
