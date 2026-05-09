import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Warehouse, AlertTriangle, Search, List, Plus } from 'lucide-react';

export default function InventarioPage() {
  const [stock, setStock] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [tab, setTab] = useState('stock');
  const [almacenFiltro, setAlmacenFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [modalAjuste, setModalAjuste] = useState(false);
  const [ajuste, setAjuste] = useState({ producto_id: '', almacen_id: '', cantidad: 0, notas: '' });
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    api.get('/api/inventario/almacenes').then(r => setAlmacenes(r.data));
    api.get('/api/productos/?limit=500').then(r => setProductos(r.data));
    loadStock();
    api.get('/api/productos/alertas-stock').then(r => setAlertas(r.data));
  }, []);

  const loadStock = (aid = '') => {
    const params = aid ? `?almacen_id=${aid}` : '';
    api.get(`/api/inventario/stock${params}`).then(r => setStock(r.data));
  };

  const handleAjuste = async () => {
    try {
      await api.post(`/api/inventario/ajuste?producto_id=${ajuste.producto_id}&almacen_id=${ajuste.almacen_id}&cantidad=${ajuste.cantidad}&notas=${ajuste.notas}`);
      toast.success('Ajuste registrado');
      setModalAjuste(false);
      loadStock(almacenFiltro);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error');
    }
  };

  const filtered = stock.filter(s =>
    s.producto_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    s.codigo_interno?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventario</h2>
          <p className="page-subtitle">Control de stock por almacén</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setModalAjuste(true)}><Plus size={15}/> Ajuste Manual</button>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} />
          <strong>{alertas.length} productos</strong> con stock mínimo alcanzado: {alertas.slice(0,3).map(a => a.nombre).join(', ')}{alertas.length > 3 ? '...' : ''}
        </div>
      )}

      <div className="flex gap-2 mb-4" style={{borderBottom:'1px solid var(--border)',paddingBottom:12}}>
        {['stock','alertas'].map(t => (
          <button key={t} className={`btn ${tab===t ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab(t)}>
            {t === 'stock' ? <><Warehouse size={13}/> Stock General</> : <><AlertTriangle size={13}/> Alertas ({alertas.length})</>}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div className="search-bar">
            <div className="search-input-wrap" style={{flex:1}}>
              <Search size={16}/><input className="form-control search-input" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{width:200}} value={almacenFiltro} onChange={e => { setAlmacenFiltro(e.target.value); loadStock(e.target.value); }}>
              <option value="">Todos los almacenes</option>
              {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Código</th><th>Producto</th><th>Almacén</th><th>Cantidad</th><th>Stock Mínimo</th><th>Estado</th><th>Kardex</th>
              </tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><span style={{fontFamily:'monospace',fontSize:12,color:'var(--primary-light)'}}>{s.codigo_interno}</span></td>
                    <td>{s.producto_nombre}</td>
                    <td>{s.almacen_nombre}</td>
                    <td style={{fontWeight:700,fontSize:16}}>{s.cantidad}</td>
                    <td>{s.stock_minimo}</td>
                    <td>
                      {s.alerta
                        ? <span className="badge badge-danger">⚠ Bajo mínimo</span>
                        : <span className="badge badge-success">OK</span>}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        api.get(`/api/inventario/kardex/${s.producto_id}`).then(r => {
                          setKardex(r.data);
                          setTab('kardex_' + s.producto_id);
                        });
                      }}><List size={13}/> Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'alertas' && (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th>Stock Actual</th><th>Stock Mínimo</th></tr></thead>
            <tbody>
              {alertas.map(a => (
                <tr key={a.id}>
                  <td style={{fontFamily:'monospace',fontSize:12,color:'var(--primary-light)'}}>{a.codigo_interno}</td>
                  <td>{a.nombre}</td>
                  <td><span className="badge badge-danger">{a.stock_total}</span></td>
                  <td>{a.stock_minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab.startsWith('kardex_') && (
        <>
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => setTab('stock')}>← Volver al Stock</button>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Stock Anterior</th><th>Stock Resultante</th><th>Referencia</th><th>Almacén</th></tr></thead>
              <tbody>
                {kardex.map(k => (
                  <tr key={k.id}>
                    <td style={{fontSize:12}}>{new Date(k.created_at).toLocaleString('es-BO')}</td>
                    <td><span className={`badge ${k.tipo === 'ENTRADA' ? 'badge-success' : 'badge-danger'}`}>{k.tipo}</span></td>
                    <td style={{fontWeight:700}}>{k.tipo === 'SALIDA' ? '-' : '+'}{k.cantidad}</td>
                    <td>{k.stock_anterior}</td>
                    <td>{k.stock_resultante}</td>
                    <td><span className="badge badge-purple">{k.referencia_tipo} #{k.referencia_id}</span></td>
                    <td>{k.almacen_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalAjuste && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalAjuste(false)}>
          <div className="modal" style={{maxWidth:440}}>
            <div className="modal-header">
              <span className="modal-title">Ajuste Manual de Stock</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setModalAjuste(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{gridTemplateColumns:'1fr'}}>
                <div className="form-group">
                  <label className="form-label">Producto</label>
                  <select className="form-control" value={ajuste.producto_id} onChange={e => setAjuste({...ajuste, producto_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Almacén</label>
                  <select className="form-control" value={ajuste.almacen_id} onChange={e => setAjuste({...ajuste, almacen_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad (+ para agregar, - para quitar)</label>
                  <input type="number" className="form-control" value={ajuste.cantidad} onChange={e => setAjuste({...ajuste, cantidad: parseInt(e.target.value)||0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <input className="form-control" value={ajuste.notas} onChange={e => setAjuste({...ajuste, notas: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalAjuste(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAjuste}>Registrar Ajuste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
