import React from 'react';
import './UserStats.css';

const UserStats = ({ user }) => {
  if (!user) return null;

  return (
    <div className="user-stats">
      <div className="stat">
        <span className="stat-icon">👤</span>
        <span className="stat-label">Jugador:</span>
        <span className="stat-value">{user.username}</span>
      </div>
      
      <div className="stat">
        <span className="stat-icon">💰</span>
        <span className="stat-label">Dinero:</span>
        <span className="stat-value">${user.money?.toFixed(2)}</span>
      </div>
      
      <div className="stat">
        <span className="stat-icon">⭐</span>
        <span className="stat-label">XP:</span>
        <span className="stat-value">{user.experience}</span>
      </div>
      
      <div className="stat">
        <span className="stat-icon">🏆</span>
        <span className="stat-label">Nivel:</span>
        <span className="stat-value">{user.level}</span>
      </div>
    </div>
  );
};

export default UserStats;