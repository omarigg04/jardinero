import React from 'react';
import './Plot.css';

const Plot = ({ plot, position, onClick, isSelected }) => {
  const getPlotContent = () => {
    if (!plot.seed_type_id) {
      // Parcela vacía
      return (
        <div className="empty-plot">
          <span className="plot-number">{position + 1}</span>
          {isSelected && <span className="plant-here">🌱</span>}
        </div>
      );
    }

    // Parcela con planta
    const progress = plot.progress || 0;
    const isReady = plot.is_ready;

    return (
      <div className="planted-plot">
        <div className="plant-emoji" style={{ fontSize: isReady ? '3rem' : '2rem' }}>
          {plot.emoji}
        </div>
        <div className="plant-info">
          <div className="plant-name">{plot.seed_name}</div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isReady ? '#4CAF50' : plot.color 
              }}
            />
          </div>
          <div className="progress-text">
            {isReady ? '¡Lista!' : `${progress?.toFixed(0)}%`}
          </div>
        </div>
        {isReady && (
          <div className="harvest-indicator">
            ✨ Cosechar
          </div>
        )}
      </div>
    );
  };

  const getPlotClass = () => {
    let classes = ['plot'];
    
    if (!plot.seed_type_id) {
      classes.push('empty');
      if (isSelected) classes.push('selected');
    } else {
      classes.push('planted');
      if (plot.is_ready) classes.push('ready');
    }
    
    return classes.join(' ');
  };

  return (
    <div 
      className={getPlotClass()}
      onClick={onClick}
      title={plot.seed_type_id ? 
        `${plot.seed_name} - ${plot.is_ready ? 'Lista para cosechar' : `${plot.progress?.toFixed(1)}% crecida`}` :
        'Parcela vacía'
      }
    >
      {getPlotContent()}
    </div>
  );
};

export default Plot;