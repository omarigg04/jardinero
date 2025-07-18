import React, { useState } from 'react';
import Plot from './Plot';
import Inventory from './Inventory';
import './GameBoard.css';

const GameBoard = ({ gameState, onPlant, onHarvest, onRefresh }) => {
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [message, setMessage] = useState('');

  if (!gameState) {
    return <div className="loading">Cargando estado del juego...</div>;
  }

  const handlePlotClick = async (plotPosition) => {
    const plot = gameState.plots[plotPosition];
    
    if (plot.seed_type_id && plot.is_ready) {
      // Cosechar
      const result = await onHarvest(plotPosition);
      if (result.success) {
        setMessage(`¡${result.message}! 🎉`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${result.error}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } else if (!plot.seed_type_id && selectedSeed) {
      // Plantar
      const result = await onPlant(plotPosition, selectedSeed.seed_type_id);
      if (result.success) {
        setMessage(`¡Semilla de ${selectedSeed.name} plantada! 🌱`);
        setSelectedSeed(null);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${result.error}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } else if (plot.seed_type_id) {
      setMessage(`Esta planta está creciendo... ${plot.progress?.toFixed(1)}% completo`);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const getPlotInstructions = () => {
    if (selectedSeed) {
      return `Haz clic en una parcela vacía para plantar ${selectedSeed.name} 🌱`;
    }
    return 'Selecciona una semilla del inventario para plantar, o cosecha plantas listas 🌾';
  };

  return (
    <div className="game-board">
      <div className="board-header">
        <h3>🌾 Mi Jardín (2x4)</h3>
        <button onClick={onRefresh} className="refresh-btn">
          🔄 Actualizar
        </button>
      </div>

      {message && (
        <div className="game-message">
          {message}
        </div>
      )}

      <div className="instructions">
        {getPlotInstructions()}
      </div>

      <div className="garden-grid">
        {gameState.plots.map((plot, index) => (
          <Plot
            key={index}
            plot={plot}
            position={index}
            onClick={() => handlePlotClick(index)}
            isSelected={selectedSeed && !plot.seed_type_id}
          />
        ))}
      </div>

      <Inventory
        seedInventory={gameState.seed_inventory || []}
        fruitInventory={gameState.fruit_inventory || []}
        selectedSeed={selectedSeed}
        onSelectSeed={setSelectedSeed}
      />
    </div>
  );
};

export default GameBoard;