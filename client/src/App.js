import React, { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import GameBoard from './components/GameBoard';
import Shop from './components/Shop';
import UserStats from './components/UserStats';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [activeTab, setActiveTab] = useState('game');
  const [loading, setLoading] = useState(false);

  // Configurar axios con token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchGameState();
    }
  }, []);

  const fetchGameState = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/game/state`);
      setGameState(response.data);
      setUser({
        id: response.data.id,
        username: response.data.username,
        money: parseFloat(response.data.money),
        experience: response.data.experience,
        level: response.data.level
      });
    } catch (error) {
      console.error('Error cargando estado del juego:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await fetchGameState();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username,
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await fetchGameState();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setGameState(null);
    setActiveTab('game');
  };

  const updatePlants = async () => {
    try {
      await axios.post(`${API_BASE}/game/update-plants`);
      await fetchGameState();
    } catch (error) {
      console.error('Error actualizando plantas:', error);
    }
  };

  const plantSeed = async (plotPosition, seedTypeId) => {
    try {
      await axios.post(`${API_BASE}/game/plant`, {
        plotPosition,
        seedTypeId
      });
      await fetchGameState();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error plantando semilla' 
      };
    }
  };

  const harvestPlant = async (plotPosition) => {
    try {
      const response = await axios.post(`${API_BASE}/game/harvest`, {
        plotPosition
      });
      await fetchGameState();
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error cosechando planta' 
      };
    }
  };

  // Auto-actualizar cada 30 segundos
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        updatePlants();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>🌱 Jardinero Virtual</h1>
          <p>¡Cultiva plantas en tiempo real!</p>
        </header>
        <AuthForm onLogin={login} onRegister={register} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>🌱 Cargando tu jardín...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌱 Jardinero Virtual</h1>
        <UserStats user={user} />
        <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
      </header>

      <nav className="tab-nav">
        <button 
          className={`tab ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
        >
          🌾 Mi Jardín
        </button>
        <button 
          className={`tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🏪 Tienda
        </button>
      </nav>

      <main className="game-content">
        {activeTab === 'game' && (
          <GameBoard 
            gameState={gameState}
            onPlant={plantSeed}
            onHarvest={harvestPlant}
            onRefresh={fetchGameState}
          />
        )}
        {activeTab === 'shop' && (
          <Shop 
            gameState={gameState}
            onPurchase={fetchGameState}
          />
        )}
      </main>
    </div>
  );
}

export default App;
