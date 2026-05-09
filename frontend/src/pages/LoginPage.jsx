import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Loader } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido al sistema');
      navigate('/dashboard');
    } catch {
      toast.error('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>📦 TUMOMITO</h1>
          <p>Sistema ERP — Importadora Mayorista</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div className="search-input-wrap">
              <Mail size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)'}} />
              <input
                id="login-email"
                type="email"
                className="form-control search-input"
                placeholder="admin@tumomito.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="search-input-wrap">
              <Lock size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)'}} />
              <input
                id="login-password"
                type="password"
                className="form-control search-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} disabled={loading}>
            {loading ? <Loader size={16} className="spin" /> : <Lock size={16} />}
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:12,color:'var(--text-dim)'}}>
          Demo: admin@tumomito.com / Admin1234!
        </p>
      </div>
    </div>
  );
}
