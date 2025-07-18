import React, { useState } from 'react';
import './AuthForm.css';

const AuthForm = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Formulario enviado con datos:', formData);
    console.log('📝 Modo login:', isLogin);
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        console.log('🔑 Llamando función onLogin...');
        result = await onLogin(formData.username, formData.password);
      } else {
        console.log('👤 Llamando función onRegister...');
        result = await onRegister(formData.username, formData.email, formData.password);
      }
      console.log('📋 Resultado:', result);

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      username: '',
      email: '',
      password: ''
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Tu nombre de usuario"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Tu contraseña"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '⏳ Procesando...' : (isLogin ? '🔑 Entrar' : '🌱 Crear Cuenta')}
          </button>
        </form>

        <button onClick={toggleMode} className="toggle-btn">
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;