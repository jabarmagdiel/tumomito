import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const WA_NUMBER = "59176666750";

export default function CatalogoPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/comercial/categorias`).then(r => r.json()).then(setCategorias);
    fetch(`${API_URL}/api/comercial/promociones`).then(r => r.json()).then(setPromociones);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (catFiltro) params.set('categoria_id', catFiltro);
    params.set('limit', '80');
    fetch(`${API_URL}/api/comercial/productos?${params}`)
      .then(r => r.json())
      .then(data => { setProductos(data); setLoading(false); });
  }, [search, catFiltro]);

  const EMOJIS = ['📦','🛒','🏠','🎯','⭐','🎁','💡','🔧','🍀','🌟'];
  const getEmoji = (nombre) => EMOJIS[nombre.charCodeAt(0) % EMOJIS.length];

  return (
    <div className="catalogo-page">
      {/* Header */}
      <div className="catalogo-header">
        <div>
          <h1>📦 TUMOMITO</h1>
          <p style={{color:'var(--text-muted)',marginTop:4}}>Importadora Mayorista — Catálogo de Productos</p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=Hola%20TUMOMITO%2C%20quiero%20información%20sobre%20sus%20productos`}
          target="_blank" rel="noopener noreferrer"
          className="btn btn-whatsapp"
        >
          💬 WhatsApp
        </a>
      </div>

      {/* Promociones */}
      {promociones.length > 0 && (
        <div style={{background:'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(99,102,241,0.1))',borderBottom:'1px solid var(--border)',padding:'12px 32px',display:'flex',gap:16,overflowX:'auto'}}>
          {promociones.map(p => (
            <div key={p.id} style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:8,padding:'8px 16px',whiteSpace:'nowrap'}}>
              🏷️ <strong>{p.nombre}</strong> — <span style={{color:'var(--secondary)'}}>-{p.descuento_pct}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="catalogo-body">
        {/* Filtros */}
        <div style={{display:'flex',gap:12,marginBottom:28,flexWrap:'wrap'}}>
          <input
            className="form-control"
            style={{flex:1,minWidth:240}}
            placeholder="🔍 Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-control" style={{width:220}} value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:80,color:'var(--text-muted)'}}>Cargando catálogo...</div>
        ) : (
          <>
            <p style={{color:'var(--text-muted)',marginBottom:20,fontSize:13}}>{productos.length} productos encontrados</p>
            <div className="product-grid">
              {productos.map(p => (
                <div key={p.id} className="product-card">
                  <div className="product-img">{getEmoji(p.nombre)}</div>
                  <div className="product-info">
                    <div className="product-name">{p.nombre}</div>
                    <div className="product-code">COD: {p.codigo_interno}</div>
                    {p.categoria && <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:6}}>📁 {p.categoria}</div>}
                    <div className="product-price">Bs. {Number(p.precio_mayorista).toFixed(2)}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>
                      Minorista: Bs. {Number(p.precio_minorista).toFixed(2)}
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                      <span className={`badge ${p.disponible ? 'badge-success' : 'badge-danger'}`}>
                        {p.disponible ? '✓ Disponible' : '✗ Sin stock'}
                      </span>
                    </div>
                    {p.disponible && (
                      <a
                        href={p.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp btn-sm"
                        style={{width:'100%',justifyContent:'center'}}
                      >
                        💬 Consultar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{borderTop:'1px solid var(--border)',padding:'20px 32px',textAlign:'center',color:'var(--text-muted)',fontSize:12}}>
        © 2024 TUMOMITO Importadora Mayorista · WhatsApp: +591 7 666 6750
      </div>
    </div>
  );
}
