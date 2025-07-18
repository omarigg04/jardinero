import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Shop.css';

const API_BASE = 'http://localhost:3000/api';

const Shop = ({ gameState, onPurchase }) => {
  const [seedTypes, setSeedTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSeedTypes();
  }, []);

  const fetchSeedTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/shop/seeds`);
      setSeedTypes(response.data);
    } catch (error) {
      console.error('Error cargando semillas:', error);
    }
  };

  const buySeed = async (seedTypeId, quantity = 1) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/shop/buy-seeds`, {
        seedTypeId,
        quantity
      });
      
      setMessage(`✅ ${response.data.message}`);
      onPurchase(); // Actualizar estado del juego
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.error || 'Error en la compra'}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const sellSeed = async (seedTypeId, quantity = 1) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/shop/sell-seeds`, {
        seedTypeId,
        quantity
      });
      
      setMessage(`✅ ${response.data.message}`);
      onPurchase(); // Actualizar estado del juego
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.error || 'Error en la venta'}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const sellFruit = async (seedTypeId, quantity = 1) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/shop/sell-fruits`, {
        seedTypeId,
        quantity
      });
      
      setMessage(`✅ ${response.data.message}`);
      onPurchase(); // Actualizar estado del juego
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.error || 'Error en la venta'}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getUserSeedQuantity = (seedTypeId) => {
    const seed = gameState?.seed_inventory?.find(s => s.seed_type_id === seedTypeId);
    return seed?.quantity || 0;
  };

  const getUserFruitQuantity = (seedTypeId) => {
    const fruit = gameState?.fruit_inventory?.find(f => f.seed_type_id === seedTypeId);
    return fruit?.quantity || 0;
  };

  if (!gameState) {
    return <div className="loading">Cargando tienda...</div>;
  }

  return (
    <div className="shop">
      <div className="shop-header">
        <h3>🏪 Tienda del Jardinero</h3>
        <div className="money-display">
          💰 Dinero disponible: ${parseFloat(gameState.money || 0).toFixed(2)}
        </div>
      </div>

      {message && (
        <div className="shop-message">
          {message}
        </div>
      )}

      <div className="shop-sections">
        {/* Comprar Semillas */}
        <div className="shop-section">
          <h4>🛒 Comprar Semillas</h4>
          <div className="shop-grid">
            {seedTypes.map((seed) => (
              <div key={seed.id} className="shop-item">
                <div className="item-header">
                  <span className="item-emoji">{seed.emoji}</span>
                  <span className="item-name">{seed.name}</span>
                </div>
                <div className="item-details">
                  <div className="growth-time">
                    ⏱️ {seed.growth_time_hours}h de crecimiento
                  </div>
                  <div className="price">💰 ${seed.buy_price}</div>
                  <div className="owned">
                    Tienes: {getUserSeedQuantity(seed.id)}
                  </div>
                </div>
                <button
                  onClick={() => buySeed(seed.id)}
                  disabled={loading || parseFloat(gameState.money || 0) < seed.buy_price}
                  className="buy-btn"
                >
                  {loading ? '⏳' : '🛒'} Comprar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Vender Semillas */}
        <div className="shop-section">
          <h4>💸 Vender Semillas</h4>
          <div className="shop-grid">
            {gameState.seed_inventory?.filter(seed => seed.quantity > 0).map((seed) => (
              <div key={seed.seed_type_id} className="shop-item">
                <div className="item-header">
                  <span className="item-emoji">{seed.emoji}</span>
                  <span className="item-name">{seed.name}</span>
                </div>
                <div className="item-details">
                  <div className="price">💰 ${seed.sell_price} c/u</div>
                  <div className="owned">Tienes: {seed.quantity}</div>
                </div>
                <button
                  onClick={() => sellSeed(seed.seed_type_id)}
                  disabled={loading || seed.quantity === 0}
                  className="sell-btn"
                >
                  {loading ? '⏳' : '💸'} Vender
                </button>
              </div>
            ))}
            {(!gameState.seed_inventory || gameState.seed_inventory.every(s => s.quantity === 0)) && (
              <div className="no-items">
                No tienes semillas para vender
              </div>
            )}
          </div>
        </div>

        {/* Vender Frutos */}
        <div className="shop-section">
          <h4>🍎 Vender Frutos</h4>
          <div className="shop-grid">
            {gameState.fruit_inventory?.filter(fruit => fruit.quantity > 0).map((fruit) => (
              <div key={fruit.seed_type_id} className="shop-item highlight">
                <div className="item-header">
                  <span className="item-emoji">{fruit.emoji}</span>
                  <span className="item-name">{fruit.name}</span>
                </div>
                <div className="item-details">
                  <div className="price">💰 ${fruit.sell_price} c/u</div>
                  <div className="owned">Tienes: {fruit.quantity}</div>
                </div>
                <button
                  onClick={() => sellFruit(fruit.seed_type_id)}
                  disabled={loading || fruit.quantity === 0}
                  className="sell-btn fruit"
                >
                  {loading ? '⏳' : '🍎'} Vender Fruto
                </button>
              </div>
            ))}
            {(!gameState.fruit_inventory || gameState.fruit_inventory.every(f => f.quantity === 0)) && (
              <div className="no-items">
                No tienes frutos para vender
                <br />
                <small>¡Cosecha plantas para obtener frutos!</small>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shop-info">
        <h4>ℹ️ Información de la Tienda</h4>
        <ul>
          <li>🌱 Las semillas tienen diferentes tiempos de crecimiento</li>
          <li>🍎 Los frutos se venden por mucho más dinero que las semillas</li>
          <li>⭐ Cosechar plantas te da experiencia</li>
          <li>🔄 Al cosechar obtienes 2 semillas nuevas + 1 fruto</li>
        </ul>
      </div>
    </div>
  );
};

export default Shop;