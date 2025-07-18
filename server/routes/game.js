const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Función para calcular el progreso de crecimiento en JavaScript
function calculatePlantGrowthProgress(plantedAt, growthTimeHours) {
    if (!plantedAt || !growthTimeHours || growthTimeHours <= 0) {
        return 0;
    }
    
    const now = new Date();
    const planted = new Date(plantedAt);
    const hoursElapsed = (now - planted) / (1000 * 60 * 60); // Convertir ms a horas
    const progress = Math.min(100, (hoursElapsed / growthTimeHours) * 100);
    
    return Math.round(progress * 100) / 100; // Redondear a 2 decimales
}

// Obtener estado completo del juego del usuario
router.get('/state', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Consulta compleja para obtener todo el estado del juego
    const query = `
        SELECT 
            u.id,
            u.username,
            u.money,
            u.experience,
            u.level,
            -- Inventario de semillas
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'seed_type_id', ui.seed_type_id,
                    'name', st.name,
                    'quantity', ui.quantity,
                    'emoji', st.emoji,
                    'buy_price', st.buy_price,
                    'sell_price', st.sell_price
                )
            ) FROM user_inventory ui 
            JOIN seed_types st ON ui.seed_type_id = st.id 
            WHERE ui.user_id = u.id) as seed_inventory,
            -- Inventario de frutos
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'seed_type_id', uf.seed_type_id,
                    'name', st.name,
                    'quantity', uf.quantity,
                    'emoji', st.emoji,
                    'sell_price', st.fruit_sell_price
                )
            ) FROM user_fruits uf 
            JOIN seed_types st ON uf.seed_type_id = st.id 
            WHERE uf.user_id = u.id) as fruit_inventory,
            -- Estado del terreno con cálculo de progreso
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'position', up.plot_position,
                    'seed_type_id', up.seed_type_id,
                    'seed_name', st.name,
                    'emoji', st.emoji,
                    'color', st.color,
                    'planted_at', up.planted_at,
                    'growth_time_hours', st.growth_time_hours,
                    'is_ready', up.is_ready_to_harvest,
                    'progress', NULL
                )
            ) FROM user_plots up 
            LEFT JOIN seed_types st ON up.seed_type_id = st.id 
            WHERE up.user_id = u.id 
            ORDER BY up.plot_position) as plots
        FROM users u
        WHERE u.id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error obteniendo estado del juego:', err);
            return res.status(500).json({ error: 'Error obteniendo estado del juego' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const gameState = results[0];
        
        // Parsear JSON strings (verificar si ya son objetos)
        gameState.seed_inventory = typeof gameState.seed_inventory === 'string' 
            ? JSON.parse(gameState.seed_inventory || '[]') 
            : gameState.seed_inventory || [];
        gameState.fruit_inventory = typeof gameState.fruit_inventory === 'string' 
            ? JSON.parse(gameState.fruit_inventory || '[]') 
            : gameState.fruit_inventory || [];
        gameState.plots = typeof gameState.plots === 'string' 
            ? JSON.parse(gameState.plots || '[]') 
            : gameState.plots || [];

        // Calcular progreso de crecimiento en JavaScript
        if (Array.isArray(gameState.plots)) {
            gameState.plots = gameState.plots.map(plot => {
                // Calcular progreso usando nuestra función JS
                const progress = plot.planted_at ? 
                    calculatePlantGrowthProgress(plot.planted_at, plot.growth_time_hours) : 0;
                
                // Determinar si está lista para cosechar
                const isReady = progress >= 100;
                
                return {
                    ...plot,
                    progress: progress,
                    is_ready: isReady
                };
            });
        }

        res.json(gameState);
    });
});

// Plantar una semilla
router.post('/plant', authenticateToken, (req, res) => {
    const { plotPosition, seedTypeId } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Verificar que el usuario tiene la semilla
    const checkSeed = 'SELECT quantity FROM user_inventory WHERE user_id = ? AND seed_type_id = ?';
    db.query(checkSeed, [userId, seedTypeId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando inventario' });
        }

        if (results.length === 0 || results[0].quantity < 1) {
            return res.status(400).json({ error: 'No tienes esa semilla en tu inventario' });
        }

        // Verificar que la parcela está vacía
        const checkPlot = 'SELECT seed_type_id FROM user_plots WHERE user_id = ? AND plot_position = ?';
        db.query(checkPlot, [userId, plotPosition], (err, plotResults) => {
            if (err) {
                return res.status(500).json({ error: 'Error verificando parcela' });
            }

            if (plotResults.length === 0) {
                return res.status(400).json({ error: 'Parcela no válida' });
            }

            if (plotResults[0].seed_type_id !== null) {
                return res.status(400).json({ error: 'La parcela ya está ocupada' });
            }

            // Comenzar transacción
            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error iniciando transacción' });
                }

                // Reducir inventario de semillas
                const updateInventory = 'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND seed_type_id = ?';
                db.query(updateInventory, [userId, seedTypeId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error actualizando inventario' });
                        });
                    }

                    // Plantar la semilla
                    const plantSeed = 'UPDATE user_plots SET seed_type_id = ?, planted_at = NOW(), is_ready_to_harvest = FALSE WHERE user_id = ? AND plot_position = ?';
                    db.query(plantSeed, [seedTypeId, userId, plotPosition], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error plantando semilla' });
                            });
                        }

                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error confirmando transacción' });
                                });
                            }

                            res.json({ message: 'Semilla plantada exitosamente' });
                        });
                    });
                });
            });
        });
    });
});

// Cosechar una planta
router.post('/harvest', authenticateToken, (req, res) => {
    const { plotPosition } = req.body;
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Usar el procedimiento almacenado para cosechar
    const harvestQuery = 'CALL HarvestPlant(?, ?)';
    db.query(harvestQuery, [userId, plotPosition], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error cosechando planta' });
        }

        const result = results[0][0];
        if (result.result === 'success') {
            res.json({ 
                message: 'Planta cosechada exitosamente', 
                experienceGained: result.experience_gained 
            });
        } else {
            res.status(400).json({ error: result.message });
        }
    });
});

// Actualizar estado de plantas (verificar si están listas para cosechar)
router.post('/update-plants', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const db = req.app.locals.db;

    // Obtener plantas que necesitan verificación
    const selectQuery = `
        SELECT up.id, up.planted_at, st.growth_time_hours
        FROM user_plots up
        JOIN seed_types st ON up.seed_type_id = st.id
        WHERE up.user_id = ? 
        AND up.seed_type_id IS NOT NULL 
        AND up.is_ready_to_harvest = FALSE
        AND up.planted_at IS NOT NULL
    `;

    db.query(selectQuery, [userId], (err, plants) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo plantas' });
        }

        let plantsToUpdate = [];
        
        // Verificar cada planta con JavaScript
        plants.forEach(plant => {
            const progress = calculatePlantGrowthProgress(plant.planted_at, plant.growth_time_hours);
            if (progress >= 100) {
                plantsToUpdate.push(plant.id);
            }
        });

        if (plantsToUpdate.length === 0) {
            return res.json({ 
                message: 'Estado de plantas actualizado', 
                plantsReady: 0 
            });
        }

        // Actualizar plantas listas
        const updateQuery = `UPDATE user_plots SET is_ready_to_harvest = TRUE WHERE id IN (${plantsToUpdate.map(() => '?').join(',')})`;
        
        db.query(updateQuery, plantsToUpdate, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error actualizando plantas' });
            }

            res.json({ 
                message: 'Estado de plantas actualizado', 
                plantsReady: results.affectedRows 
            });
        });
    });
});

module.exports = router;