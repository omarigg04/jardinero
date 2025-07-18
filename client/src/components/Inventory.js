import React from 'react';
import './Inventory.css';

const Inventory = ({ seedInventory, fruitInventory, selectedSeed, onSelectSeed }) => {
  const handleSeedClick = (seed) => {
    if (seed.quantity > 0) {
      if (selectedSeed?.seed_type_id === seed.seed_type_id) {
        onSelectSeed(null); // Deseleccionar si ya está seleccionada
      } else {
        onSelectSeed(seed); // Seleccionar nueva semilla
      }
    }
  };

  return (
    <div className="inventory">
      <div className="inventory-section">
        <h4>🌰 Semillas</h4>
        <div className="inventory-grid">
          {seedInventory.map((seed) => (
            <div
              key={seed.seed_type_id}
              className={`inventory-item ${seed.quantity === 0 ? 'empty' : ''} ${
                selectedSeed?.seed_type_id === seed.seed_type_id ? 'selected' : ''
              }`}
              onClick={() => handleSeedClick(seed)}
              title={`${seed.name} - Tienes ${seed.quantity}`}
            >
              <div className="item-emoji">{seed.emoji}</div>
              <div className="item-name">{seed.name}</div>
              <div className="item-quantity">{seed.quantity}</div>
              {seed.quantity > 0 && (
                <div className="item-price">💰 ${seed.buy_price}</div>
              )}
            </div>
          ))}
        </div>
        {selectedSeed && (
          <div className="selected-info">
            ✅ Seleccionada: {selectedSeed.name} {selectedSeed.emoji}
          </div>
        )}
      </div>

      <div className="inventory-section">
        <h4>🍎 Frutos</h4>
        <div className="inventory-grid">
          {fruitInventory.map((fruit) => (
            <div
              key={fruit.seed_type_id}
              className={`inventory-item ${fruit.quantity === 0 ? 'empty' : ''}`}
              title={`${fruit.name} - Tienes ${fruit.quantity}`}
            >
              <div className="item-emoji">{fruit.emoji}</div>
              <div className="item-name">{fruit.name}</div>
              <div className="item-quantity">{fruit.quantity}</div>
              {fruit.quantity > 0 && (
                <div className="item-price">💰 ${fruit.sell_price}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inventory;