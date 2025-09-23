// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import { ROUTES } from '../constants/routes';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      console.log('[360MVP] Register: User already authenticated, redirecting to dashboard');
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('[360MVP] Register: Attempting registration...');
      await register(email, password);
      console.log('[360MVP] Register: Registration successful');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      console.error('[360MVP] Register: Registration failed:', error);
      setError('Error al registrarse: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('[360MVP] Register: Attempting Google sign in...');
      await signInWithGoogle();
      console.log('[360MVP] Register: Google sign in successful');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      console.error('[360MVP] Register: Google sign in failed:', error);
      setError('Error al registrarse con Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Crear Cuenta</h2>
      {error && <div style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px'}}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: '15px'}}>
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{width: '100%', padding: '10px'}}
            disabled={loading}
          />
        </div>
        <div style={{marginBottom: '15px'}}>
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{width: '100%', padding: '10px'}}
            disabled={loading}
          />
        </div>
        <div style={{marginBottom: '15px'}}>
          <input 
            type="password" 
            placeholder="Confirmar Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{width: '100%', padding: '10px'}}
            disabled={loading}
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          style={{width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', marginBottom: '10px'}}
        >
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <div style={{textAlign: 'center', margin: '20px 0', color: '#666'}}>o</div>

      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#db4437', 
          color: 'white', 
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        🔗 Registrarse con Google
      </button>

      <p style={{textAlign: 'center', marginTop: '20px'}}>
        ¿Ya tienes cuenta? <Link to={ROUTES.LOGIN}>Iniciar Sesión</Link>
      </p>
      
      <div style={{textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666'}}>
        <p>🔑 Demo: Usa cualquier email/password para el emulador</p>
      </div>
    </div>
  );
};

export default Register;