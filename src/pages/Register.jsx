import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validar contraseñas coinciden
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar longitud mínima
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    
    try {
      await register(email, password);
      console.log('[360MVP] Register: Email registration successful');
      navigate("/dashboard");
    } catch (ex) {
      console.error('[360MVP] Register: Email registration failed:', ex);
      setError(ex.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        console.log('[360MVP] Register: Google registration successful');
        navigate("/dashboard");
      } else {
        console.warn('[360MVP] Register: Google registration failed:', result.message);
        setError(result.message);
      }
    } catch (ex) {
      console.error('[360MVP] Register: Google registration error:', ex);
      setError('Error inesperado en registro con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '28px' }}>360MVP</h1>
          <p style={{ margin: 0, color: '#6c757d' }}>Crea tu cuenta nueva</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Google Register Button */}
        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ffffff',
            color: '#495057',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.borderColor = '#28a745')}
          onMouseLeave={(e) => !loading && (e.target.style.borderColor = '#e9ecef')}
        >
          <span style={{ fontSize: '18px' }}>🔍</span>
          {loading ? 'Registrando con Google...' : '🔍 Registrarse con Google'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0',
          color: '#6c757d',
          fontSize: '14px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }}></div>
          <span style={{ padding: '0 16px' }}>o</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }}></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailRegister}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1e7e34')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#28a745')}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#6c757d' }}>
          ¿Ya tienes una cuenta?{' '}
          <Link 
            to="/login"
            style={{ 
              color: '#007bff', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Development Info */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#d4edda',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#155724',
          textAlign: 'center'
        }}>
          ✅ <strong>Google OAuth:</strong> Registro real con Google
        </div>
      </div>
    </div>
  );
}